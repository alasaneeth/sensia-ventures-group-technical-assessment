import React, { useState, useEffect } from "react";
import {
    Form,
    Input,
    Button,
    message,
    Select,
    InputNumber,
    Checkbox,
    Row,
    Col,
} from "antd";
import { updateSku, createSku, getSkuById } from "../../api/sku";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import CurrencyDropdown from "../ui/CurrencyDropdown";
import ProductVariationDetails from "../products/ProductVariationDetails";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import { getProductVariations } from "../../api/productVariation";

function SkuForm({ initialValues, onSuccess }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        initialValues?.brand?.companyId || null
    );
    const [selectedBrandId, setSelectedBrandId] = useState(
        initialValues?.brandId || null
    );
    const [selectedProductVariation, setSelectedProductVariation] =
        useState(null);

    // Handle company selection
    function handleCompanySelect(company) {
        if (company) {
            setSelectedCompanyId(company.id);
            form.setFieldsValue({ companyId: company.id });
            // Reset brand and product variation when company changes
            setSelectedBrandId(null);
            setSelectedProductVariation(null);
            form.setFieldsValue({ brandId: null, productVariationId: null });
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
            // Reset product variation when brand changes
            setSelectedProductVariation(null);
            form.setFieldsValue({ productVariationId: null });
        } else {
            setSelectedBrandId(null);
            form.setFieldsValue({ brandId: null });
        }
    }

    // Handle product variation selection
    function handleProductVariationSelect(pv) {
        if (pv) {
            setSelectedProductVariation(pv);
            form.setFieldsValue({ productVariationId: pv.id });
            // Auto-calculate price based on quantity and product variation price
            const quantity = form.getFieldValue("quantity") || 1;
            const calculatedPrice = (pv.pricingPerItem || 0) * quantity;
            form.setFieldsValue({ price: calculatedPrice });
        } else {
            setSelectedProductVariation(null);
            form.setFieldsValue({ productVariationId: null });
        }
    }

    // Handle quantity change to recalculate price
    function handleQuantityChange(quantity) {
        if (selectedProductVariation && quantity) {
            const calculatedPrice =
                (selectedProductVariation.pricingPerItem || 0) * quantity;
            form.setFieldsValue({ price: calculatedPrice });
        }
    }
    function handleDiscountChange(discount) {
        if (selectedProductVariation && discount) {
            const priceToPay =
                (selectedProductVariation.pricingPerItem || 0) *
                    +form.getFieldValue("quantity") -
                +discount;
            form.setFieldsValue({ sellingPrice: priceToPay });
        }
    }

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                code: initialValues.code,
                name: initialValues.name,
                companyId: initialValues.brand?.companyId,
                brandId: initialValues.brandId,
                upsell: initialValues.upsell,
                productVariationId: initialValues.productVariationId,
                quantity: initialValues.quantity,
                qtyDetail: initialValues.qtyDetail,
                description: initialValues.description,
                price: initialValues.price,
                currency: initialValues.currency,
                discount: initialValues.discount,
                rule: initialValues.rule,
                ifGiftVisible: initialValues.ifGiftVisible,
            });
        } else {
            // Set default currency to Euro
            form.setFieldsValue({
                currency: "€",
            });
        }
    }, [initialValues, form]);

    // Fetch product variation details when updating a SKU
    useEffect(() => {
        const fetchProductVariation = async () => {
            if (
                initialValues?.id &&
                initialValues?.productVariationId &&
                !selectedProductVariation
            ) {
                try {
                    const result = await getSkuById(initialValues.id);
                    if (result?.data?.productVariation) {
                        setSelectedProductVariation(
                            result.data.productVariation
                        );
                    }
                } catch (error) {
                    console.error("Error fetching SKU details:", error);
                }
            }
        };

        fetchProductVariation();
    }, [initialValues?.id, initialValues?.productVariationId]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (initialValues?.id) {
                await updateSku(initialValues.id, values);
                message.success("SKU updated successfully");
            } else {
                await createSku(values);
                message.success("SKU created successfully");
            }

            onSuccess();
        } catch (error) {
            console.error("Error saving SKU:", error);
            message.error(
                error?.response?.data?.message || "Failed to save SKU"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
        >
            <Form.Item
                label="Company"
                name="companyId"
                rules={[{ required: true, message: "Please select a company" }]}
            >
                <DynamicDropdownMenu
                    key={
                        initialValues?.brand?.companyId || "no-initial-company"
                    }
                    onSelect={handleCompanySelect}
                    selectedValue={selectedCompanyId}
                    placeholder="Select a company"
                    fetchFunction={async (page, rowsPerPage, passedFilter) => {
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

            <Form.Item
                label="Brand"
                name="brandId"
                rules={[{ required: true, message: "Please select a brand" }]}
            >
                <DynamicDropdownMenu
                    key={`${selectedCompanyId || "no-company"}-${
                        initialValues?.brandId || "no-brand"
                    }`}
                    onSelect={handleBrandSelect}
                    selectedValue={selectedBrandId}
                    placeholder="Select a brand"
                    disabled={!selectedCompanyId}
                    fetchFunction={async (page, rowsPerPage, passedFilter) => {
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

            <Form.Item
                label="Product Variation"
                name="productVariationId"
                rules={[
                    {
                        required: true,
                        message: "Please select a product variation",
                    },
                ]}
            >
                <DynamicDropdownMenu
                    key={`${selectedBrandId || "no-brand"}`}
                    onSelect={handleProductVariationSelect}
                    selectedValue={initialValues?.productVariationId}
                    placeholder="Select product variation"
                    disabled={!selectedBrandId}
                    fetchFunction={async (page, rowsPerPage, passedFilter) => {
                        if (!selectedBrandId) {
                            return { pagination: {}, data: [] };
                        }

                        const filters = {
                            ...passedFilter,
                            brandId: [{ eq: selectedBrandId }],
                        };

                        const result = await getProductVariations(
                            page,
                            rowsPerPage,
                            filters
                        );
                        return {
                            pagination: result?.pagination || {},
                            data: result?.data || [],
                        };
                    }}
                    searchBy="code"
                    setOptions={(data) => {
                        return data.map((pv) => {
                            const productName = pv.product?.name || "";
                            const variationName = pv.name || pv.variation || "";
                            const variationUpc = pv.upcCode || "";

                            const variationPart = variationName
                                ? `${variationName}${
                                      variationUpc ? ` - ${variationUpc}` : ""
                                  }`
                                : variationUpc;

                            return {
                                value: pv.id,
                                label: `product name: ${productName}, product variation: ${variationPart}`,
                                ...pv,
                            };
                        });
                    }}
                />
            </Form.Item>

            <ProductVariationDetails
                productVariation={selectedProductVariation}
            />

            <Form.Item label="SKU Name" name="name">
                <Input placeholder="Enter SKU name" />
            </Form.Item>

            <Form.Item
                label="SKU Code"
                name="code"
                rules={[{ required: true, message: "Please enter SKU code" }]}
            >
                <Input placeholder="Enter SKU code" />
            </Form.Item>

            <Form.Item label="Upsell" name="upsell">
                <Input placeholder="Enter upsell information" />
            </Form.Item>

            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item label="Quantity" name="quantity">
                        <InputNumber
                            min={1}
                            placeholder="Enter quantity"
                            onChange={handleQuantityChange}
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item label="Quantity Detail" name="qtyDetail">
                        <Input placeholder="e.g., 5 + 3 free" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item label="Description" name="description">
                <Input.TextArea placeholder="Enter SKU description" rows={3} />
            </Form.Item>

            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item label="Price (Auto-calculated)" name="price">
                        <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            placeholder="Auto-calculated"
                            disabled
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item label="Currency" name="currency">
                        <CurrencyDropdown />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item label="Discount" name="discount">
                        <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            onChange={handleDiscountChange}
                            placeholder="Enter discount"
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        label="Selling Price (Price - Discount)"
                        name="sellingPrice"
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            placeholder="Auto-calculated"
                            disabled
                            value={
                                (form.getFieldValue("price") || 0) -
                                (form.getFieldValue("discount") || 0)
                            }
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item label="Rule" name="rule">
                        <Input placeholder="Enter rule" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item>
                <Row gutter={8}>
                    <Col xs={24} sm={12}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            {initialValues?.id ? "Update" : "Create"} SKU
                        </Button>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Button block onClick={() => form.resetFields()}>
                            Reset
                        </Button>
                    </Col>
                </Row>
            </Form.Item>
        </Form>
    );
}

export default SkuForm;
