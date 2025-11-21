import React, { useState, useEffect, useRef } from "react";
import {
    Form,
    Input,
    InputNumber,
    Button,
    Card,
    message,
    Spin,
    Select,
    DatePicker,
    Row,
    Col,
} from "antd";
import { useNavigate } from "react-router-dom";
import { createPayment } from "../../api/accounting";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import DynamicDropdownMenu from "../../components/ui/DynamicDropdownMenu";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
const { Option } = Select;

function AddPayment({ initialValues = {}, mode="Create Payment", onSubmit, onCancel }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        initialValues?.brand?.companyId || initialValues?.company?.id || initialValues.companyId || null
    );
    const [selectedBrandId, setSelectedBrandId] = useState(
        initialValues?.brandId || initialValues?.brand?.id || null
    );

    // Determine if this is update mode
    const isUpdateMode = onSubmit && Object.keys(initialValues).length > 0;

    // Store original data for comparison
    const originalData = useRef({});

    // Initialize originalData with initialValues to properly detect changes
    if (isUpdateMode && Object.keys(originalData.current).length === 0) {
        originalData.current = { 
            ...initialValues,
            companyId: initialValues?.brand?.companyId || initialValues?.company?.id || null,
            brandId: initialValues?.brandId || initialValues?.brand?.id || null,
        };
    }

    // Handle company selection
    const handleCompanySelect = (company) => {
        if (company) {
            setSelectedCompanyId(company.id);
            form.setFieldsValue({ companyId: company.id });
            // Reset brand when company changes
            setSelectedBrandId(null);
            form.setFieldsValue({ brandId: null });
        } else {
            setSelectedCompanyId(null);
            form.setFieldsValue({ companyId: null });
        }
    };

    // Handle brand selection
    const handleBrandSelect = (brand) => {
        if (brand) {
            setSelectedBrandId(brand.id);
            form.setFieldsValue({ brandId: brand.id });
        } else {
            setSelectedBrandId(null);
            form.setFieldsValue({ brandId: null });
        }
    };

    if (initialValues.createdAt) {
        initialValues.createdAt = dayjs(initialValues.createdAt);
    }

    // Track changes in form fields
    const handleValuesChange = (changedValues, allValues) => {
        // Update the form with new values
        form.setFieldsValue(allValues);
    };

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
                // Only send changed data
                const changedData = {};

                Object.keys(values).forEach((key) => {
                    if (originalData.current[key] !== values[key]) {
                        changedData[key] = values[key];
                    }
                });

                // Include brandId if it changed
                const originalBrandId = originalData.current?.brandId || originalData.current?.brand?.id || null;
                if (selectedBrandId !== originalBrandId) {
                    changedData.brandId = selectedBrandId;
                }

                // Format date if it changed
                if (changedData.createdAt) {
                    changedData.createdAt = changedData.createdAt.format("YYYY-MM-DD");
                }

                // If no changes, don't submit
                if (Object.keys(changedData).length === 0) {
                    message.info("No changes made");
                    setLoading(false);
                    return;
                }

                await onSubmit(changedData);
            } else {
                // Default submit behavior
                // Prepare payment data
                const paymentData = {
                    partner: values.partner,
                    amount: values.amount,
                    currency: values.currency,
                    brandId: selectedBrandId,
                };

                // Only include createdAt if it was provided
                if (values.createdAt) {
                    paymentData.createdAt = values.createdAt.format("YYYY-MM-DD");
                }

                const result = await createPayment(paymentData);

                if (result?.data) {
                    message.success("Payment created successfully!");
                    form.resetFields();
                    setSelectedCompanyId(null);
                    setSelectedBrandId(null);
                    // Navigate to payments tab after successful creation
                    setTimeout(() => {
                        navigate("/accounting/payments");
                    }, 500);
                } else {
                    message.error("Failed to create payment");
                }
            }
        } catch (error) {
            console.error("Error saving payment:", error);
            message.error("Error saving payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            title={mode}
            style={{ maxWidth: 600, margin: "0 auto" }}
        >
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    onValuesChange={handleValuesChange}
                    initialValues={{
                        currency: "€",
                        ...initialValues,
                    }}
                >
                    <Form.Item label="Partner" name="partner">
                        <Input placeholder="Enter partner name" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item 
                                name="companyId" 
                                label="Company" 
                                rules={[{ required: true, message: "Please select a company" }]}
                            >
                                <DynamicDropdownMenu
                                    onSelect={handleCompanySelect}
                                    selectedValue={selectedCompanyId}
                                    placeholder="Select Company"
                                    fetchFunction={(page, rowsPerPage, passedFilter) => getCompanies(page, rowsPerPage, passedFilter).then((result) => ({ pagination: result?.pagination || {}, data: result?.data || [], }))}
                                    searchBy="name"
                                    setOptions={(data) => data.map((c) => ({ value: c.id, label: c.name || `Company ${c.id}`, }))}
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
                                    fetchFunction={async (page, rowsPerPage, passedFilter) => {
                                        if (!selectedCompanyId) { return { pagination: {}, data: [] }; }
                                        return getBrands(selectedCompanyId, page, rowsPerPage, passedFilter).then((result) => ({ pagination: result?.pagination || {}, data: result?.data || [], }));
                                    }}
                                    searchBy="name"
                                    setOptions={(data) => data.map((b) => ({ value: b.id, label: b.name || `Brand ${b.id}`, }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Amount"
                        name="amount"
                        rules={[
                            // {
                                
                            //     type: "number",
                            //     min: 0,
                            //     message: "Amount must be a positive number",
                            // },
                        ]}
                    >
                        <InputNumber
                            placeholder="Enter amount"
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

                    <Form.Item label="Creation Date" name="createdAt">
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
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                        >
                            {mode === "Create Payment" ? "Create Payment" : "Update Payment"}
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </Card>
    );
}

export default AddPayment;

/*
client offer id=: 1210
current offer: 52559
availableAt: '9/10/2025'
client id: 3171
campaign id: 6129

INSERT INTO offer_prints ("clientId", "offerId", "campaignId", "availableAt", "offerCode", "isExported", "createdAt", "updatedAt")
VALUES (4563, 52559, 6129, '8/10/2025', 'Q65PBWR', false, '2025-10-10 14:56:56', '2025-10-10 14:56:56');


*/
