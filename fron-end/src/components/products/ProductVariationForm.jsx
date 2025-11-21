import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Form,
    Input,
    Button,
    Card,
    message,
    Row,
    Col,
    InputNumber,
    Select,
} from "antd";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import CurrencyDropdown from "../ui/CurrencyDropdown";
import {
    createProductVariation,
    updateProductVariation,
} from "../../api/productVariation";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import { getProducts } from "../../api/product";

function ProductVariationForm({ initialValues, onSuccess }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Get URL params for pre-filling
    const urlCompanyId = searchParams.get("companyId");
    const urlBrandId = searchParams.get("brandId");
    const urlProductId = searchParams.get("productId");

    const [selectedCompanyId, setSelectedCompanyId] = useState(
        initialValues?.brand?.companyId ||
            urlCompanyId 
    );
    const [selectedBrandId, setSelectedBrandId] = useState(
        initialValues?.brandId || (urlBrandId ? parseInt(urlBrandId) : null)
    );
    const [selectedProductId, setSelectedProductId] = useState(
        initialValues?.productId ||
            urlProductId 
    );

    // Set form values from URL params on mount
    useEffect(() => {
        if (urlCompanyId || urlBrandId || urlProductId) {
            form.setFieldsValue({
                companyId: urlCompanyId ? parseInt(urlCompanyId) : undefined,
                brandId: urlBrandId ? parseInt(urlBrandId) : undefined,
                productId: urlProductId ? parseInt(urlProductId) : undefined,
            });
        }
    }, [urlCompanyId, urlBrandId, urlProductId, form]);

    // Handle company selection
    function handleCompanySelect(company) {
        if (company) {
            setSelectedCompanyId(company.id);
            form.setFieldsValue({ companyId: company.id });
            // Reset brand and product when company changes
            setSelectedBrandId(null);
            setSelectedProductId(null);
            form.setFieldsValue({ brandId: null, productId: null });
        } else {
            setSelectedCompanyId(null);
            form.setFieldsValue({ companyId: null });
        }
    }

    // Handle brand selection
    function handleBrandSelect(brand) {
        if (brand) {
            setSelectedBrandId(brand.id);
            form.setFieldsValue({ brandId: brand.id });
            // Reset product when brand changes
            setSelectedProductId(null);
            form.setFieldsValue({ productId: null });
        } else {
            setSelectedBrandId(null);
            form.setFieldsValue({ brandId: null });
        }
    }

    // Handle product selection
    function handleProductSelect(product) {
        if (product) {
            setSelectedProductId(product.id);
            form.setFieldsValue({ productId: product.id });
        } else {
            setSelectedProductId(null);
            form.setFieldsValue({ productId: null });
        }
    }

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const productVariationData = {
                productId: values.productId,
                brandId: values.brandId,
                name: values.name || null,
                code: values.code,
                variation: values.variation,
                programTime: values.programTime || null,
                posology: values.posology || null,
                description: values.description || null,
                pricingPerItem: values.pricingPerItem || null,
                currency: values.currency || null,
                formulaProductVariationFromLaboratory:
                    values.formulaProductVariationFromLaboratory || null,
                supplementFacts: values.supplementFacts || null,
                instructions: values.instructions || null,
                upcCode: values.upcCode || null,
                manufacturedDescription: values.manufacturedDescription || null,
                frontClaims: values.frontClaims || null,
                fdaStatements: values.fdaStatements || null,
            };

            if (initialValues?.id) {
                // Update existing product variation
                const res = await updateProductVariation(
                    initialValues.id,
                    productVariationData
                );
                if (typeof res === "string") {
                    setLoading(false);
                    return message.error(res);
                }
                message.success("Product variation updated successfully");
                onSuccess?.();
            } else {
                // Create new product variation
                const res = await createProductVariation(productVariationData);
                if (typeof res === "string") {
                    setLoading(false);
                    return message.error(res);
                }
                message.success("Product variation created successfully");
                form.resetFields();
                setSelectedCompanyId(null);
                setSelectedBrandId(null);
                setSelectedProductId(null);
            }
        } catch (error) {
            console.error("Error saving product variation:", error);
            message.error(
                error?.response?.data?.message ||
                    "Failed to save product variation"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            title={
                initialValues?.id
                    ? "Update Product Variation"
                    : "Add New Product Variation"
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                initialValues={
                    initialValues
                        ? {
                              companyId: initialValues.brand?.companyId,
                              brandId: initialValues.brandId,
                              productId: initialValues.productId,
                              name: initialValues.name,
                              code: initialValues.code,
                              variation: initialValues.variation,
                              programTime: initialValues.programTime,
                              posology: initialValues.posology,
                              description: initialValues.description,
                              pricingPerItem: initialValues.pricingPerItem,
                              currency: initialValues.currency || "€",
                              formulaProductVariationFromLaboratory:
                                  initialValues.formulaProductVariationFromLaboratory ||
                                  "Pending",
                              supplementFacts: initialValues.supplementFacts,
                              instructions: initialValues.instructions,
                              upcCode: initialValues.upcCode,
                              manufacturedDescription:
                                  initialValues.manufacturedDescription,
                              frontClaims: initialValues.frontClaims,
                              fdaStatements: initialValues.fdaStatements,
                          }
                        : undefined
                }
            >
                <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="companyId"
                            label="Company"
                            rules={[
                                {
                                    required: true,
                                    message: "Company is required",
                                },
                            ]}
                        >
                            <DynamicDropdownMenu
                                key={
                                    initialValues?.brand?.companyId ||
                                    "no-initial-company"
                                }
                                onSelect={handleCompanySelect}
                                selectedValue={selectedCompanyId}
                                placeholder="Select a company"
                                fetchFunction={async (
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ) => {
                                    return getCompanies(
                                        page,
                                        rowsPerPage,
                                        passedFilter
                                    ).then((result) => ({
                                        pagination: result?.pagination || {},
                                        data: result?.data || [],
                                    }));
                                }}
                                searchBy="name"
                                setOptions={(data) => {
                                    return data.map((c) => {
                                        return {
                                            value: c.id,
                                            label: c.name || `Company ${c.id}`,
                                        };
                                    });
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="brandId"
                            label="Brand"
                            rules={[
                                {
                                    required: true,
                                    message: "Brand is required",
                                },
                            ]}
                        >
                            <DynamicDropdownMenu
                                key={`${selectedCompanyId || "no-company"}-${
                                    initialValues?.brandId || "no-brand"
                                }`}
                                onSelect={handleBrandSelect}
                                selectedValue={selectedBrandId}
                                placeholder="Select a brand"
                                disabled={!selectedCompanyId}
                                fetchFunction={async (
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ) => {
                                    if (!selectedCompanyId) {
                                        return { pagination: {}, data: [] };
                                    }
                                    return getBrands(
                                        selectedCompanyId,
                                        page,
                                        rowsPerPage,
                                        passedFilter
                                    ).then((result) => ({
                                        pagination: result?.pagination || {},
                                        data: result?.data || [],
                                    }));
                                }}
                                searchBy="name"
                                setOptions={(data) => {
                                    return data.map((b) => {
                                        return {
                                            value: b.id,
                                            label: b.name || `Brand ${b.id}`,
                                        };
                                    });
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="productId"
                            label="Product"
                            rules={[
                                {
                                    required: true,
                                    message: "Product is required",
                                },
                            ]}
                        >
                            <DynamicDropdownMenu
                                key={`${selectedBrandId || "no-brand"}-${
                                    initialValues?.productId || "no-product"
                                }`}
                                onSelect={handleProductSelect}
                                selectedValue={selectedProductId}
                                placeholder="Select a product"
                                disabled={!selectedBrandId}
                                fetchFunction={async (
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ) => {
                                    if (!selectedBrandId) {
                                        return { pagination: {}, data: [] };
                                    }
                                    return getProducts(page, rowsPerPage, {
                                        ...passedFilter,
                                        brandId: [{ eq: selectedBrandId }],
                                    }).then((result) => ({
                                        pagination: result?.pagination || {},
                                        data: result?.data || [],
                                    }));
                                }}
                                searchBy="name"
                                setOptions={(data) => {
                                    return data.map((p) => {
                                        return {
                                            value: p.id,
                                            label: p.name || `Product ${p.id}`,
                                        };
                                    });
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Form.Item name="name" label="Variation Name">
                            <Input placeholder="Enter variation name (optional)" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="code"
                            label="Code"
                            rules={[
                                {
                                    required: true,
                                    message: "Code is required",
                                },
                            ]}
                        >
                            <Input placeholder="Enter code" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item name="variation" label="Variation">
                            <Input placeholder="Enter variation (optional)" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="programTime" label="Program Time">
                            <Input placeholder="Enter program time (optional)" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="posology" label="Posology">
                            <Input placeholder="Enter posology (optional)" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="pricingPerItem" label="Price Per Item">
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="Enter price"
                                min={0}
                                step={0.01}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="currency"
                            label="Currency"
                            initialValue="€"
                        >
                            <CurrencyDropdown />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="upcCode" label="UPC Code">
                            <Input placeholder="Enter UPC code (optional)" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="formulaProductVariationFromLaboratory"
                            label="Lab Formula Status"
                            initialValue="Pending"
                        >
                            <Select placeholder="Select lab formula status">
                                <Select.Option value="Pending">
                                    Pending
                                </Select.Option>
                                <Select.Option value="Approved">
                                    Approved
                                </Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item name="description" label="Description">
                            <Input.TextArea
                                rows={3}
                                placeholder="Enter description (optional, max 500 characters)"
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="supplementFacts"
                            label="Supplement Facts"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Enter supplement facts (optional)"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item name="instructions" label="Instructions">
                            <Input.TextArea
                                rows={3}
                                placeholder="Enter instructions (optional)"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="manufacturedDescription"
                            label="Manufactured Description"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Enter manufactured description (optional)"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item name="frontClaims" label="Front Claims">
                            <Input.TextArea
                                rows={3}
                                placeholder="Enter front claims (optional)"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item name="fdaStatements" label="FDA Statements">
                            <Input.TextArea
                                rows={3}
                                placeholder="Enter FDA statements (optional)"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                    >
                        {initialValues?.id
                            ? "Update Product Variation"
                            : "Create Product Variation"}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default ProductVariationForm;
