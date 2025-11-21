import { useState } from "react";
import { Form, Input, Button, Card, message, Row, Col } from "antd";
import { createPayeeName } from "../../api/payeeNames";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";

function PayeeForm() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState(null);

    // Handle form submission
    async function handleSubmit(values) {
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
            // Only send fields that match the model
            const formattedValues = {
                name: values.name,
                brandId: selectedBrandId, // companyId is accepted from frontend but not stored
            };

            const response = await createPayeeName(formattedValues);
            
            if (typeof response === "string") {
                message.error(response);
                return;
            }

            message.success("Payeename created successfully");

            // Reset the form
            handleReset();
        } catch (error) {
            console.error("Error creating payeename:", error);
            message.error("Failed to create payeename");
        } finally {
            setLoading(false);
        }
    }

    // Handle form reset
    function handleReset() {
        form.resetFields();
        setSelectedCompanyId(null);
        setSelectedBrandId(null);
    }

    // Handle company selection
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

    // Handle brand selection
    const handleBrandSelect = (brand) => {
        const brandId = brand?.id || null;
        setSelectedBrandId(brandId);
        form.setFieldsValue({ brandId: brandId });
        form.validateFields(['brandId']);
    };

    return (
        <Card>
            <Form
                form={form}
                // layout="vertical"
                onFinish={handleSubmit}
                disabled={loading}
            >
                <Form.Item
                    name="name"
                    label="Payee Name"
                    rules={[
                        { required: true, message: "Please enter Payee Name" },
                    ]}
                >
                    <Input placeholder="Enter Payee Name" />
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

                <Form.Item>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px",
                        }}
                    >
                        <Button onClick={handleReset}>Reset</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            Create Payee Name
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default PayeeForm;
