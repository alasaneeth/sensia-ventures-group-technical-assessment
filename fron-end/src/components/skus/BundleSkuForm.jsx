import React, { useState, useEffect } from "react";
import {
    Form,
    Input,
    Button,
    message,
    Table,
    Space,
    InputNumber,
    Row,
    Col,
} from "antd";
import { updateBundleSku, createBundleSku } from "../../api/bundleSku";
import { getSkus } from "../../api/sku";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import CurrencyDropdown from "../ui/CurrencyDropdown";

function BundleSkuForm({ initialValues, onSuccess }) {
    console.log(
        "\n###### [Take] ##########\n",
        initialValues,
        "\n################\n"
    );
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedSkus, setSelectedSkus] = useState([]);
    const [selectedSkuIds, setSelectedSkuIds] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        initialValues?.brand?.companyId || null
    );
    const [selectedBrandId, setSelectedBrandId] = useState(
        initialValues?.brandId || null
    );
    console.log(
        "\n########## [Take] ######\n",
        selectedCompanyId,
        "\n################\n"
    );

    // Handle company selection
    function handleCompanySelect(company) {
        if (company) {
            setSelectedCompanyId(company.id);
            form.setFieldsValue({ companyId: company.id });
            // Reset brand and SKUs when company changes
            setSelectedBrandId(null);
            setSelectedSkuIds([]);
            setSelectedSkus([]);
            form.setFieldsValue({ brandId: null });
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
            // Reset SKUs when brand changes
            setSelectedSkuIds([]);
            setSelectedSkus([]);
        } else {
            setSelectedBrandId(null);
            form.setFieldsValue({ brandId: null });
        }
    }

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                code: initialValues.code,
                name: initialValues.name,
                description: initialValues.description,
                brandId: initialValues.brandId,
                price: initialValues.price,
                currency: initialValues.currency,
                discount: initialValues.discount,
            });

            if (initialValues.skus && Array.isArray(initialValues.skus)) {
                const skusData = initialValues.skus.map((sku) => ({
                    skuId: sku.id,
                    code: sku.code,
                    name: sku.name,
                    description: sku.description,
                }));
                setSelectedSkus(skusData);
                setSelectedSkuIds(skusData.map((s) => s.skuId));
            }
        }
    }, [initialValues, form]);

    // Handle bundle price/discount changes to update selling price
    function handleBundlePriceChange(price) {
        const discount = form.getFieldValue("discount") || 0;
        const sellingPrice = (price || 0) - discount;
        form.setFieldsValue({ sellingPrice });
    }

    function handleBundleDiscountChange(discount) {
        const price = form.getFieldValue("price") || 0;
        const sellingPrice = price - (discount || 0);
        form.setFieldsValue({ sellingPrice });
    }

    const handleAddSku = (sku) => {
        if (sku && !selectedSkus.find((s) => s.skuId === sku.id)) {
            const newSku = {
                skuId: sku.id,
                code: sku.code,
                name: sku.name,
                description: sku.description,
            };
            setSelectedSkus([...selectedSkus, newSku]);
            setSelectedSkuIds([...selectedSkuIds, sku.id]);
        }
    };

    const handleRemoveSku = (skuCode) => {
        const updatedSkus = selectedSkus.filter((s) => s.code !== skuCode);
        const updatedIds = updatedSkus.map((s) => s.skuId);

        setSelectedSkus(updatedSkus);
        setSelectedSkuIds(updatedIds);
    };

    const handleSubmit = async (values) => {
        if (!values.companyId) {
            message.error("Please select a company");
            return;
        }

        if (!values.brandId) {
            message.error("Please select a brand");
            return;
        }

        if (selectedSkus.length === 0) {
            message.error("Please add at least one SKU to the bundle");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...values,
                skus: selectedSkus.map((s) => ({ skuId: s.skuId })),
            };

            if (initialValues?.id) {
                await updateBundleSku(initialValues.id, payload);
                message.success("Bundle SKU updated successfully");
            } else {
                await createBundleSku(payload);
                message.success("Bundle SKU created successfully");
            }

            onSuccess();
        } catch (error) {
            console.error("Error saving bundle SKU:", error);
            message.error(
                error?.response?.data?.message || "Failed to save bundle SKU"
            );
        } finally {
            setLoading(false);
        }
    };

    const skuColumns = [
        {
            title: "SKU Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "SKU Code",
            dataIndex: "code",
            key: "code",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Button
                    danger
                    size="small"
                    onClick={() => handleRemoveSku(record.code)}
                >
                    Remove
                </Button>
            ),
        },
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            initialValues={
                initialValues
                    ? {
                          companyId:
                              initialValues.companyId ||
                              initialValues.brand?.companyId ||
                              initialValues.brand?.company?.id,
                          brandId: initialValues.brandId,
                          code: initialValues.code,
                          name: initialValues.name,
                          description: initialValues.description,
                          price: initialValues.price,
                          currency: initialValues.currency || "€",
                          discount: initialValues.discount,
                      }
                    : undefined
            }
        >
            <Form.Item label="Company" name="companyId">
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

            <Form.Item label="Brand" name="brandId">
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

            <Form.Item label="Bundle Name" name="name">
                <Input placeholder="Enter bundle name" />
            </Form.Item>

            <Form.Item
                label="Bundle Code"
                name="code"
                rules={[
                    { required: true, message: "Please enter bundle code" },
                ]}
            >
                <Input placeholder="Enter bundle code" />
            </Form.Item>

            <Form.Item label="Description" name="description">
                <Input.TextArea
                    placeholder="Enter bundle description"
                    rows={3}
                />
            </Form.Item>

            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item label="Bundle Price" name="price">
                        <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: "100%" }}
                            placeholder="Enter bundle price"
                            onChange={handleBundlePriceChange}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item label="Bundle Currency" name="currency">
                        <CurrencyDropdown />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item label="Bundle Discount" name="discount">
                        <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: "100%" }}
                            placeholder="Enter bundle discount"
                            onChange={handleBundleDiscountChange}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item
                        label="Bundle Selling Price (Price - Discount)"
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

            <Form.Item label="Add SKUs to Bundle">
                <DynamicDropdownMenu
                    key={`${selectedBrandId || "no-brand"}-${
                        selectedSkuIds.length
                    }`}
                    onSelect={handleAddSku}
                    placeholder={
                        selectedBrandId
                            ? "Select SKU to add"
                            : "Please select a brand first"
                    }
                    disabled={!selectedBrandId}
                    fetchFunction={async (page, rowsPerPage, passedFilter) => {
                        if (!selectedBrandId) {
                            return { pagination: {}, data: [] };
                        }

                        const filters = {
                            ...passedFilter,
                            brandId: [{ eq: selectedBrandId }],
                        };

                        // Exclude already selected SKUs
                        if (selectedSkuIds.length > 0) {
                            filters.id = [{ notIn: selectedSkuIds }];
                        }

                        const result = await getSkus(
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
                        return data.map((sku) => {
                            return {
                                value: sku.id,
                                label: `${sku.name || ""} - ${sku.code || ""}`,
                                ...sku,
                            };
                        });
                    }}
                />
            </Form.Item>

            <Form.Item label="Selected SKUs">
                <Table
                    columns={skuColumns}
                    dataSource={selectedSkus}
                    rowKey="skuId"
                    pagination={false}
                    size="small"
                />
            </Form.Item>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {initialValues?.id ? "Update" : "Create"} Bundle SKU
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
}

export default BundleSkuForm;
