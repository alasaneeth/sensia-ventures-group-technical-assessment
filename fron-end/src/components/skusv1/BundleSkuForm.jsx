import React, { useState, useRef } from "react";
import {
    Form,
    Input,
    InputNumber,
    Button,
    Card,
    message,
    Spin,
    Select,
    Divider,
    Table,
    Space,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { createBundleSku, updateBundleSku } from "../../api/bundleSku";
import SkuSelector from "./SkuSelector";

const { TextArea } = Input;

function BundleSkuForm({ initialValues = {}, mode = "Create Bundle SKU", onSuccess }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [skuSelectorVisible, setSkuSelectorVisible] = useState(false);
    const [selectedSkus, setSelectedSkus] = useState(
        initialValues.skus?.map((sku, index) => ({
            key: index,
            skuId: sku.id,
            skuCode: sku.skuCode,
            title: sku.title,
            quantity: sku.BundleSkuItem?.quantity || 1,
            sortOrder: sku.BundleSkuItem?.sortOrder || index + 1,
            notes: sku.BundleSkuItem?.notes || "",
        })) || []
    );

    // Store original data for comparison
    const originalData = useRef(initialValues);

    const handleAddSkus = (skus) => {
        const newSkus = skus.map((sku, index) => ({
            key: Date.now() + index,
            skuId: sku.id,
            skuCode: sku.skuCode,
            title: sku.title,
            quantity: 1,
            sortOrder: selectedSkus.length + index + 1,
            notes: "",
        }));
        setSelectedSkus([...selectedSkus, ...newSkus]);
        setSkuSelectorVisible(false);
    };

    const handleRemoveSku = (key) => {
        setSelectedSkus(selectedSkus.filter((sku) => sku.key !== key));
    };

    const handleQuantityChange = (key, quantity) => {
        setSelectedSkus(
            selectedSkus.map((sku) =>
                sku.key === key ? { ...sku, quantity } : sku
            )
        );
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const bundleData = {
                ...values,
                skus: selectedSkus.map((sku) => ({
                    skuId: sku.skuId,
                    quantity: sku.quantity,
                    sortOrder: sku.sortOrder,
                    notes: sku.notes,
                })),
            };

            if (mode === "Update Bundle SKU" && initialValues.id) {
                // Update mode
                const result = await updateBundleSku(initialValues.id, bundleData);

                if (result?.data) {
                    message.success("Bundle SKU updated successfully!");
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    message.error(result?.message || "Failed to update bundle SKU");
                }
            } else {
                // Create mode
                const result = await createBundleSku(bundleData);

                if (result?.data) {
                    message.success("Bundle SKU created successfully!");
                    form.resetFields();
                    setSelectedSkus([]);
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    message.error("Failed to create bundle SKU");
                }
            }
        } catch (error) {
            console.error("Error saving bundle SKU:", error);
            const errorMessage =
                error?.response?.data?.message || "Error saving bundle SKU";
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const skuColumns = [
        {
            title: "SKU Code",
            dataIndex: "skuCode",
            key: "skuCode",
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity",
            render: (text, record) => (
                <InputNumber
                    min={1}
                    value={record.quantity}
                    onChange={(value) => handleQuantityChange(record.key, value)}
                />
            ),
        },
        {
            title: "Sort Order",
            dataIndex: "sortOrder",
            key: "sortOrder",
        },
        {
            title: "Actions",
            key: "actions",
            render: (text, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveSku(record.key)}
                >
                    Remove
                </Button>
            ),
        },
    ];

    return (
        <Card title={mode} style={{ maxWidth: 1000, margin: "0 auto" }}>
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        currency: "EUR",
                        active: true,
                        ...initialValues,
                    }}
                >
                    <Card title="Bundle Details" size="small" style={{ marginBottom: 16 }}>
                        <Form.Item
                            label="Bundle Code"
                            name="bundleCode"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter bundle code",
                                },
                            ]}
                        >
                            <Input placeholder="Enter unique bundle code" />
                        </Form.Item>

                        <Form.Item
                            label="Bundle Name"
                            name="bundleName"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter bundle name",
                                },
                            ]}
                        >
                            <Input placeholder="Enter bundle name" />
                        </Form.Item>

                        <Form.Item label="Client" name="client">
                            <Input placeholder="Enter client name" />
                        </Form.Item>

                        <Form.Item label="Category" name="category">
                            <Input placeholder="Enter category" />
                        </Form.Item>

                        <Form.Item label="Description" name="description">
                            <TextArea placeholder="Enter description" rows={3} />
                        </Form.Item>

                        <Form.Item label="Total Price" name="totalPrice">
                            <InputNumber
                                placeholder="Enter total price"
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

                        <Form.Item label="Notes" name="notes">
                            <TextArea placeholder="Enter notes" rows={2} />
                        </Form.Item>

                        <Form.Item label="Active" name="active">
                            <Select>
                                <Select.Option value={true}>Yes</Select.Option>
                                <Select.Option value={false}>No</Select.Option>
                            </Select>
                        </Form.Item>
                    </Card>

                    <Card title="SKUs in Bundle" size="small" style={{ marginBottom: 16 }}>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => setSkuSelectorVisible(true)}
                            style={{ marginBottom: 16, width: "100%" }}
                        >
                            Add SKUs to Bundle
                        </Button>

                        <Table
                            columns={skuColumns}
                            dataSource={selectedSkus}
                            pagination={false}
                            size="small"
                            locale={{ emptyText: "No SKUs added yet" }}
                        />

                        {selectedSkus.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <strong>Total SKUs in Bundle:</strong> {selectedSkus.length}
                            </div>
                        )}
                    </Card>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                        >
                            {mode === "Create Bundle SKU"
                                ? "Create Bundle SKU"
                                : "Update Bundle SKU"}
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>

            <SkuSelector
                visible={skuSelectorVisible}
                onCancel={() => setSkuSelectorVisible(false)}
                onSelect={handleAddSkus}
                excludeIds={selectedSkus.map((sku) => sku.skuId)}
            />
        </Card>
    );
}

export default BundleSkuForm;

