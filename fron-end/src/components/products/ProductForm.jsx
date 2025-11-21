import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Form,
    Input,
    Button,
    Card,
    message,
    Row,
    Col,
    Select,
    InputNumber,
    Tag,
} from "antd";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { createProduct, updateProduct } from "../../api/product";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import { getCategories } from "../../api/category";

function ProductForm({ initialValues, onSuccess }) {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        initialValues?.brand?.companyId || null
    );
    const [selectedBrandId, setSelectedBrandId] = useState(
        initialValues?.brandId || null
    );
    const [selectedCategoryIds, setSelectedCategoryIds] = useState(
        initialValues?.categories?.map((cat) => cat.id) || []
    );
    const [selectedCategories, setSelectedCategories] = useState(
        initialValues?.categories || []
    );

    // Handle company selection
    function handleCompanySelect(company) {
        if (company) {
            setSelectedCompanyId(company.id);
            form.setFieldsValue({ companyId: company.id });
            // Reset brand and categories when company changes
            setSelectedBrandId(null);
            setSelectedCategoryIds([]);
            setSelectedCategories([]);
            form.setFieldsValue({ brandId: null, categoryId: [] });
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
            // Reset categories when brand changes
            setSelectedCategoryIds([]);
            setSelectedCategories([]);
            form.setFieldsValue({ categoryId: [] });
        } else {
            setSelectedBrandId(null);
            form.setFieldsValue({ brandId: null });
        }
    }

    // Handle category selection
    function handleCategorySelect(category) {
        if (category) {
            // Add the new category to the existing ones
            const updatedCategories = [...selectedCategories, category];
            const updatedCategoryIds = updatedCategories.map((cat) => cat.id);
            setSelectedCategoryIds(updatedCategoryIds);
            setSelectedCategories(updatedCategories);
            form.setFieldsValue({ categoryId: updatedCategoryIds });
        }
    }

    // Handle removing a category
    function handleRemoveCategory(categoryId) {
        const updatedCategories = selectedCategories.filter(cat => cat.id !== categoryId);
        const updatedCategoryIds = updatedCategories.map(cat => cat.id);
        setSelectedCategories(updatedCategories);
        setSelectedCategoryIds(updatedCategoryIds);
        form.setFieldsValue({ categoryId: updatedCategoryIds });
    }

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const productData = {
                name: values.productName,
                code: values.productCode,
                internalCode: values.internalCode,
                representation: values.productRepresentation || null,
                brandId: values.brandId,
                categoryId: values.categoryId || [],
            };

            if (initialValues?.id) {
                // Update existing product
                const res = await updateProduct(initialValues.id, productData);
                if (typeof res === "string") {
                    setLoading(false);
                    return message.error(res);
                }
                message.success("Product updated successfully");
                onSuccess?.();
            } else {
                // Create new product
                const res = await createProduct(productData);
                if (typeof res === "string") {
                    setLoading(false);
                    return message.error(res);
                }
                message.success("Product created successfully");
                form.resetFields();
                setSelectedCompanyId(null);
                setSelectedBrandId(null);
            }
        } catch (error) {
            console.error("Error saving product:", error);
            message.error(
                error?.response?.data?.message || "Failed to save product"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={initialValues?.id ? "Update Product" : "Add New Product"}>
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
                              productName: initialValues.name,
                              productCode: initialValues.code,
                              internalCode: initialValues.internalCode,
                              productRepresentation:
                                  initialValues.representation,
                              categoryId:
                                  initialValues.categories?.map(
                                      (cat) => cat.id
                                  ) || [],
                          }
                        : undefined
                }
            >
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
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
                    <Col xs={24} sm={12}>
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
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="productName"
                            label="Product Name"
                            rules={[
                                {
                                    required: true,
                                    message: "Product name is required",
                                },
                            ]}
                        >
                            <Input placeholder="Enter product name" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="productCode"
                            label="Product Code"
                            rules={[
                                {
                                    required: true,
                                    message: "Product code is required",
                                },
                            ]}
                        >
                            <Input placeholder="Enter product code" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="internalCode"
                            label="Internal Code"
                            rules={[
                                {
                                    required: true,
                                    message: "Internal code is required",
                                },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="Enter internal code"
                                min={0}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="productRepresentation"
                            label="Product Representation"
                            initialValue="Real"
                        >
                            <Select placeholder="Select product representation">
                                <Select.Option value="Real">Real</Select.Option>
                                <Select.Option value="Virtual">
                                    Virtual
                                </Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24}>
                        {selectedCategories.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                    Selected Categories:
                                </div>
                                <div>
                                    {selectedCategories.map((category) => (
                                        <Tag
                                            key={category.id}
                                            closable
                                            onClose={() => handleRemoveCategory(category.id)}
                                            style={{ marginBottom: 8 }}
                                        >
                                            {category.name}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Form.Item
                            name="categoryId"
                            label="Add More Categories"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "At least one category is required",
                                },
                            ]}
                        >
                            <DynamicDropdownMenu
                                key={`${selectedBrandId || "no-brand"}-${selectedCategoryIds.length}`}
                                onSelect={handleCategorySelect}
                                // selectedValue={selectedCategoryIds}
                                placeholder="Select categories"
                                disabled={!selectedBrandId}
                                mode="multiple"
                                fetchFunction={async (
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ) => {
                                    if (!selectedBrandId) {
                                        return { pagination: {}, data: [] };
                                    }

                                    const filters = {
                                        ...passedFilter,
                                        brandId: [{ eq: selectedBrandId }],
                                    };

                                    // Exclude already selected categories
                                    if (selectedCategoryIds.length > 0) {
                                        filters.id = [{ notIn: selectedCategoryIds }];
                                    }

                                    const result = await getCategories(page, rowsPerPage, filters);
                                    return {
                                        pagination: result?.pagination || {},
                                        data: result?.data || [],
                                    };
                                }}
                                searchBy="name"
                                setOptions={(data) => {
                                    return data.map((cat) => {
                                        return {
                                            value: cat.id,
                                            label:
                                                cat.name ||
                                                `Category ${cat.id}`,
                                        };
                                    });
                                }}
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
                            ? "Update Product"
                            : "Create Product"}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default ProductForm;
