import React, { useState, useRef, useEffect } from "react";
import {
    Form,
    Input,
    InputNumber,
    Button,
    Card,
    message,
    Spin,
    Tabs,
    Select,
    DatePicker,
} from "antd";
import { createProductSku, updateProductSku } from "../../api/productSku";
import ProductVariationSelector from "./ProductVariationSelector";
import dayjs from "dayjs";

const { TextArea } = Input;
const { TabPane } = Tabs;

function SkuForm({ initialValues = {}, mode = "Create SKU", onSuccess }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState(null);

    // Store original data for comparison
    const originalData = useRef(initialValues);

    useEffect(() => {
        if (initialValues.date) {
            form.setFieldsValue({
                ...initialValues,
                date: dayjs(initialValues.date),
            });
        }
    }, [initialValues, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Format the data
            const formattedValues = {
                ...values,
                date: values.date ? values.date.toISOString() : null,
            };

            if (mode === "Update SKU" && initialValues.id) {
                // Update mode - only send changed data
                const changedData = {};

                Object.keys(formattedValues).forEach((key) => {
                    if (originalData.current[key] !== formattedValues[key]) {
                        changedData[key] = formattedValues[key];
                    }
                });

                // If no changes, don't submit
                if (Object.keys(changedData).length === 0) {
                    message.info("No changes made");
                    setLoading(false);
                    return;
                }

                const result = await updateProductSku(initialValues.id, changedData);

                if (result?.data) {
                    message.success("SKU updated successfully!");
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    message.error(result?.message || "Failed to update SKU");
                }
            } else {
                // Create mode
                const result = await createProductSku(formattedValues);

                if (result?.data) {
                    message.success("SKU created successfully!");
                    form.resetFields();
                    setSelectedVariation(null);
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    message.error("Failed to create SKU");
                }
            }
        } catch (error) {
            console.error("Error saving SKU:", error);
            const errorMessage =
                error?.response?.data?.message || "Error saving SKU";
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={mode} style={{ maxWidth: 1000, margin: "0 auto" }}>
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        currency: "EUR",
                        qty: 1,
                        active: true,
                        ...initialValues,
                    }}
                >
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Basic Information" key="1">
                            <Form.Item label="Client" name="client">
                                <Input placeholder="Enter client name" />
                            </Form.Item>

                            <Form.Item label="SKU Code" name="skuCode">
                                <Input placeholder="Enter unique SKU code" />
                            </Form.Item>

                            <Form.Item label="Title" name="title">
                                <Input placeholder="Enter SKU title" />
                            </Form.Item>

                            <Form.Item label="Category" name="category">
                                <Input placeholder="Enter category" />
                            </Form.Item>

                            <Form.Item label="Description" name="description">
                                <TextArea
                                    placeholder="Enter description"
                                    rows={4}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Active"
                                name="active"
                                valuePropName="checked"
                            >
                                <Select>
                                    <Select.Option value={true}>Yes</Select.Option>
                                    <Select.Option value={false}>No</Select.Option>
                                </Select>
                            </Form.Item>
                        </TabPane>

                        <TabPane tab="Product Association" key="2">
                            <Form.Item
                                label="Product Variation"
                                name="productVariationId"
                                rules={[
                                    {
                                        required: false,
                                        message: "Please select a product variation",
                                    },
                                ]}
                            >
                                <ProductVariationSelector
                                    value={form.getFieldValue("productVariationId")}
                                    onChange={(value, variation) => {
                                        form.setFieldsValue({
                                            productVariationId: value,
                                        });
                                        setSelectedVariation(variation);
                                    }}
                                />
                            </Form.Item>

                            {selectedVariation && (
                                <Card
                                    size="small"
                                    title="Selected Product Variation Details"
                                    style={{ marginBottom: 16 }}
                                >
                                    <p>
                                        <strong>Code:</strong>{" "}
                                        {selectedVariation.productVariationCode}
                                    </p>
                                    <p>
                                        <strong>Description:</strong>{" "}
                                        {selectedVariation.productVariationDescription}
                                    </p>
                                    <p>
                                        <strong>Pricing per Bottle:</strong> €
                                        {selectedVariation.pricingPerBottle}
                                    </p>
                                </Card>
                            )}

                            <Form.Item
                                label="Quantity"
                                name="qty"
                                rules={[
                                    {
                                        required: false,
                                        message: "Please enter quantity",
                                    },
                                ]}
                                tooltip="Number of product variation units in this SKU"
                            >
                                <InputNumber
                                    placeholder="Enter quantity"
                                    style={{ width: "100%" }}
                                    min={1}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Quantity Detail"
                                name="qtyDetail"
                                tooltip="E.g., '5 +3 free'"
                            >
                                <Input placeholder="E.g., 5 +3 free" />
                            </Form.Item>
                        </TabPane>

                        <TabPane tab="Pricing & Marketing" key="3">
                            <Form.Item label="Price" name="price">
                                <InputNumber
                                    placeholder="Enter price"
                                    style={{ width: "100%" }}
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                />
                            </Form.Item>

                            <Form.Item label="Currency" name="currency">
                                <Select>
                                    <Select.Option value="EUR">EUR</Select.Option>
                                    <Select.Option value="USD">USD</Select.Option>
                                    <Select.Option value="GBP">GBP</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Discount" name="discount">
                                <InputNumber
                                    placeholder="Enter discount"
                                    style={{ width: "100%" }}
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                />
                            </Form.Item>

                            <Form.Item label="Bundle SKU ID" name="bundleSkuId">
                                <InputNumber
                                    placeholder="Enter bundle SKU ID (optional)"
                                    style={{ width: "100%" }}
                                    min={1}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Dependent SKU ID"
                                name="dependentSkuId"
                            >
                                <InputNumber
                                    placeholder="Enter dependent SKU ID (optional)"
                                    style={{ width: "100%" }}
                                    min={1}
                                />
                            </Form.Item>

                            <Form.Item label="Upsell" name="upsell">
                                <Input placeholder="Enter upsell information" />
                            </Form.Item>

                            <Form.Item label="Rule" name="rule">
                                <Input placeholder="Enter business rule" />
                            </Form.Item>
                        </TabPane>

                        <TabPane tab="Additional Fields" key="4">
                            <Form.Item label="Offer Code" name="offerCode">
                                <Input placeholder="Enter offer code" />
                            </Form.Item>

                            <Form.Item
                                label="Comments if Gift Visible"
                                name="commentsIfGiftVisible"
                            >
                                <TextArea
                                    placeholder="Enter comments"
                                    rows={3}
                                />
                            </Form.Item>

                            <Form.Item label="Colonne1" name="colonne1">
                                <Input placeholder="Enter value" />
                            </Form.Item>

                            <Form.Item
                                label="Produit Réel dans Prostock"
                                name="produitReelDansProstock"
                            >
                                <Input placeholder="Enter value" />
                            </Form.Item>

                            <Form.Item
                                label="Average Qty Per Order"
                                name="averageQtyPerOrder"
                            >
                                <InputNumber
                                    placeholder="Enter average quantity"
                                    style={{ width: "100%" }}
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Gifts or Parcel Insert"
                                name="giftsOrParcelInsert"
                            >
                                <Input placeholder="Enter value" />
                            </Form.Item>

                            <Form.Item label="Date" name="date">
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </TabPane>
                    </Tabs>

                    <Form.Item style={{ marginTop: 20 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                        >
                            {mode === "Create SKU" ? "Create SKU" : "Update SKU"}
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </Card>
    );
}

export default SkuForm;

