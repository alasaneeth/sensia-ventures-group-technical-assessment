import React, { useState } from "react";
import { Button, Dropdown, Modal, Form, message, Row, Col, Checkbox } from "antd";
import { MoreOutlined, EditOutlined } from "@ant-design/icons";
import CountryDropdown from "../ui/CountryDropdown";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import { updatePaymentMethod } from "../../api/campaign";

function PaymentMethodActions({ record, refreshList }) {
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState(null);

    const showUpdateModal = () => {
        const companyId = record?.brand?.companyId || record?.company?.id || null;
        const brandId = record?.brandId || record?.brand?.id || null;
        setSelectedCompanyId(companyId);
        setSelectedBrandId(brandId);
        form.setFieldsValue({
            country: record.country,
            paymentMethod: record.paymentMethod,
            companyId: companyId,
            brandId: brandId,
        });
        setIsUpdateModalVisible(true);
    };

    const handleCompanySelect = (company) => {
        const companyId = company?.id || null;
        setSelectedCompanyId(companyId);
        setSelectedBrandId(null); // Reset brand when company changes
        form.setFieldsValue({ 
            companyId: companyId,
            brandId: null
        });
        form.validateFields(['companyId', 'brandId']);
    };

    const handleBrandSelect = (brand) => {
        const brandId = brand?.id || null;
        setSelectedBrandId(brandId);
        form.setFieldsValue({ brandId: brandId });
        form.validateFields(['brandId']);
    };

    const handleUpdateSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

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

            const response = await updatePaymentMethod(record.id, {
                ...values,
                brandId: selectedBrandId,
            });

            if (response.success) {
                message.success("Payment method updated successfully");
                setIsUpdateModalVisible(false);
                refreshList();
            } else {
                message.error(
                    response.message || "Failed to update payment method"
                );
            }
        } catch (error) {
            console.error("Error updating payment method:", error);
            message.error("Failed to update payment method");
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit Payment Method",
            onClick: showUpdateModal,
        },
    ];

    return (
        <>
            <Dropdown
                menu={{ items }}
                placement="bottomRight"
                trigger={["click"]}
            >
                <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>

            <Modal
                title="Update Payment Method"
                open={isUpdateModalVisible}
                onCancel={() => setIsUpdateModalVisible(false)}
                onOk={handleUpdateSubmit}
                confirmLoading={loading}
                okText="Update"
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        country: record.country,
                        paymentMethod: record.paymentMethod,
                    }}
                >
                    <Form.Item
                        name="country"
                        label="Country"
                        rules={[
                            {
                                required: true,
                                message: "Please select a country",
                            },
                        ]}
                    >
                        <CountryDropdown />
                    </Form.Item>

                    <Form.Item
                        name="paymentMethod"
                        label="Payment Methods"
                        rules={[
                            {
                                validator: (_, value) => {
                                    if (!value || value.length === 0) {
                                        return Promise.reject(
                                            new Error("Please select at least one payment method")
                                        );
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Checkbox.Group>
                            <Row>
                                <Col xs={24} sm={8}>
                                    <Checkbox value="cash">Cash</Checkbox>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Checkbox value="check">Check</Checkbox>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Checkbox value="postal">Postal</Checkbox>
                                </Col>
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
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
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}

export default PaymentMethodActions;
