import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Spin, Select, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createInvoice, updateInvoice } from '../../api/accounting';
import DynamicDropdownMenu from '../ui/DynamicDropdownMenu';
import { getCompanies } from '../../api/companies';
import { getBrands } from '../../api/brands';
import dayjs from 'dayjs';

const { Option } = Select;

function InvoiceForm({ initialValues = {}, onSubmit, onCancel }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        initialValues?.brand?.companyId || initialValues?.company?.id || null
    );
    const [selectedBrandId, setSelectedBrandId] = useState(
        initialValues?.brandId || initialValues?.brand?.id || null
    );

    // Store original data for comparison in update mode
    const originalData = useRef({});

    // Determine if this is update mode
    const isUpdateMode = onSubmit && Object.keys(initialValues).length > 0;
    
    // Initialize originalData with initialValues to properly detect changes
    if (isUpdateMode && Object.keys(originalData.current).length === 0) {
        originalData.current = { 
            ...initialValues,
            companyId: initialValues?.brand?.companyId || initialValues?.company?.id || null,
            brandId: initialValues?.brandId || initialValues?.brand?.id || null,
        };
    }

    // Convert initialValues createdAt to dayjs object if needed
    useEffect(() => {
        if (initialValues.createdAt) {
            let dateValue = initialValues.createdAt;

            // Convert string or Date to dayjs object
            if (typeof dateValue === 'string') {
                dateValue = dayjs(dateValue);
            } else if (dateValue instanceof Date) {
                dateValue = dayjs(dateValue);
            }

            form.setFieldsValue({
                ...initialValues,
                createdAt: dateValue,
            });
        }
    }, [initialValues, form]);

    const handleSubmit = async (values) => {
        // Validate company and brand are selected
        if (!selectedCompanyId) {
            message.error("Please select a company");
            form.setFields([{ name: 'companyId', errors: ['Please select a company'] }]);
            setLoading(false);
            return;
        }

        if (!selectedBrandId) {
            message.error("Please select a brand");
            form.setFields([{ name: 'brandId', errors: ['Please select a brand'] }]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // If custom onSubmit is provided, use it
            if (onSubmit) {
                await onSubmit(values);
            } else {
                // Prepare invoice data
                const invoiceData = {
                    partner: values.partner,
                    subject: values.subject,
                    code: values.code,
                    price: values.price,
                    currency: values.currency,
                    brandId: selectedBrandId,
                };

                // Only include createdAt if it was provided
                if (values.createdAt) {
                    invoiceData.createdAt = values.createdAt.format("YYYY-MM-DD");
                }

                if (isUpdateMode) {
                    // Update mode - only send changed data
                    const changedData = {};
                    Object.keys(values).forEach((key) => {
                        if (originalData.current[key] !== values[key]) {
                            changedData[key] = values[key];
                        }
                    });

                    const originalBrandId = originalData.current?.brandId || originalData.current?.brand?.id || null;
                    
                    if (selectedBrandId !== originalBrandId) {
                        changedData.brandId = selectedBrandId;
                    }

                    if (values.createdAt && originalData.current.createdAt !== values.createdAt.format("YYYY-MM-DD")) {
                        changedData.createdAt = values.createdAt.format("YYYY-MM-DD");
                    }

                    if (Object.keys(changedData).length === 0) {
                        message.info("No changes made");
                        setLoading(false);
                        return;
                    }

                    const result = await updateInvoice(initialValues.id, changedData);

                    if (typeof result === "string") {
                        message.error(result);
                        return;
                    }

                    message.success("Invoice updated successfully");
                    if (onCancel) {
                        onCancel();
                    }
                } else {
                    // Create mode
                    const result = await createInvoice(invoiceData);

                    if (result?.data) {
                        message.success("Invoice created successfully!");
                        form.resetFields();
                        setSelectedCompanyId(null);
                        setSelectedBrandId(null);
                        // Navigate to invoices tab after successful creation
                        setTimeout(() => {
                            navigate("/accounting/invoices");
                        }, 500);
                    } else {
                        message.error("Failed to create invoice");
                    }
                }
            }
        } catch (error) {
            console.error("Error saving invoice:", error);
            message.error("Error saving invoice");
        } finally {
            setLoading(false);
        }
    };

    function handleReset() {
        form.resetFields();
        setSelectedCompanyId(null);
        setSelectedBrandId(null);
    }

    const handleCompanySelect = (company) => {
        const companyId = company?.id || null;
        setSelectedCompanyId(companyId);
        setSelectedBrandId(null); // Reset brand when company changes
        form.setFieldsValue({
            companyId: companyId,
            brandId: null
        });
        form.validateFields(['brandId']).catch(() => {}); // Clear brand validation error
    };

    const handleBrandSelect = (brand) => {
        const brandId = brand?.id || null;
        setSelectedBrandId(brandId);
        form.setFieldsValue({ brandId: brandId });
        form.validateFields(['brandId']).catch(() => {}); // Clear validation errors
    };

    return (
        <Card title="Create Invoice" style={{ maxWidth: 600, margin: '0 auto' }}>
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        currency: '€',
                        ...initialValues
                    }}
                >
                    <Form.Item label="Partner" name="partner">
                        <Input placeholder="Enter partner name" />
                    </Form.Item>

                    <Form.Item label="Subject" name="subject">
                        <Input placeholder="Enter subject" />
                    </Form.Item>

                    <Form.Item label="Code" name="code">
                        <Input placeholder="Enter code" />
                    </Form.Item>

                    <Form.Item
                        label="Price"
                        name="price"
                        rules={[
                            {
                                type: "number",
                                min: 0,
                                message: "Price must be a positive number",
                            },
                        ]}
                    >
                        <InputNumber
                            placeholder="Enter price"
                            style={{ width: "100%" }}
                            formatter={(value) =>
                                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) =>
                                value?.replace(/\$\s?|(,*)/g, "")
                            }
                        />
                    </Form.Item>

                    <Form.Item label="Currency" name="currency">
                        <Select>
                            <Option value="€">Euro</Option>
                            <Option value="$">Dollar</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="companyId"
                        label="Company"
                        rules={[
                            {
                                required: true,
                                message: "Please select a company",
                                validator: (_, value) => {
                                    if (!selectedCompanyId) {
                                        return Promise.reject(new Error("Please select a company"));
                                    }
                                    return Promise.resolve();
                                }
                            },
                        ]}
                    >
                        <DynamicDropdownMenu
                            onSelect={handleCompanySelect}
                            selectedValue={selectedCompanyId}
                            placeholder="Select a company"
                            fetchFunction={(page, rowsPerPage, passedFilter) =>
                                getCompanies(page, rowsPerPage, passedFilter).then((result) => ({
                                    pagination: result?.pagination || {},
                                    data: result?.data || [],
                                }))
                            }
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
                        name="brandId"
                        label="Brand"
                        rules={[
                            {
                                required: true,
                                message: "Please select a brand",
                                validator: (_, value) => {
                                    if (!selectedBrandId) {
                                        return Promise.reject(new Error("Please select a brand"));
                                    }
                                    return Promise.resolve();
                                }
                            },
                        ]}
                    >
                        <DynamicDropdownMenu
                            key={selectedCompanyId || "no-company"}
                            onSelect={handleBrandSelect}
                            selectedValue={selectedBrandId}
                            placeholder={
                                selectedCompanyId
                                    ? "Select a brand"
                                    : "Please select a company first"
                            }
                            disabled={!selectedCompanyId}
                            fetchFunction={(page, rowsPerPage, passedFilter) => {
                                if (!selectedCompanyId) {
                                    return Promise.resolve({
                                        pagination: {},
                                        data: [],
                                    });
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
                        label="Creation Date"
                        name="createdAt"
                    >
                        <DatePicker
                            onChange={(value) => {
                                form.setFieldsValue({
                                    createdAt: value,
                                });
                            }}
                            style={{ width: "100%" }}
                            format="YYYY-MM-DD"
                        />
                    </Form.Item>

                    <Form.Item>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                {isUpdateMode ? 'Update Invoice' : 'Create Invoice'}
                            </Button>
                            {onCancel && (
                                <Button onClick={onCancel} block>
                                    Cancel
                                </Button>
                            )}
                            {!isUpdateMode && (
                                <Button onClick={handleReset} block>
                                    Reset
                                </Button>
                            )}
                        </div>
                    </Form.Item>
                </Form>
            </Spin>
        </Card>
    );
}

export default InvoiceForm;