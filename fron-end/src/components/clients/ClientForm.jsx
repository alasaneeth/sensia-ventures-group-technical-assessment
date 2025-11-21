import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Form,
    Input,
    Button,
    Card,
    message,
    Row,
    Col,
    DatePicker,
    Select,
} from "antd";
import CountryDropdown from "../ui/CountryDropdown";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { createClient } from "../../api/client";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import dayjs from "dayjs";
import { sendGermany } from "../../util/germanyConverter";

function ClientForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isDataEntry = searchParams.get("data-entry") === "t";
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState(null);
    
    // Handle company selection
    function handleCompanySelect(company) {
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
    }
    
    // Handle brand selection
    function handleBrandSelect(brand) {
        if (brand) {
            setSelectedBrandId(brand.id);
            form.setFieldsValue({ brandId: brand.id });
        } else {
            setSelectedBrandId(null);
            form.setFieldsValue({ brandId: null });
        }
    }

    // Handle form submission
    async function handleSubmit(values) {
        setLoading(true);
        try {
            // Validate required fields
            if (!values.firstName || values.firstName.trim() === "") {
                message.error("First name is required");
                setLoading(false);
                return;
            }
            if (!values.lastName || values.lastName.trim() === "") {
                message.error("Last name is required");
                setLoading(false);
                return;
            }
            if (!values.address1 || values.address1.trim() === "") {
                message.error("Address line 1 is required");
                setLoading(false);
                return;
            }
            if (!values.zipCode || values.zipCode.trim() === "") {
                message.error("ZIP/Postal code is required");
                setLoading(false);
                return;
            }
            if (!values.country) {
                message.error("Country is required");
                setLoading(false);
                return;
            }
            
            if (!values.companyId) {
                message.error("Company is required");
                setLoading(false);
                return;
            }

            // Format date values properly before sending
            if (values.birthDate) {
                values.birthDate = values.birthDate.toISOString();
            }
            if (values.country) {
                values.country = sendGermany(values.country);
            }

            console.log("Submitting client data:", values);
            const data = await createClient(values);
            if (typeof data === "string") return message.error(data);

            message.success("Client created successfully");

            if (isDataEntry) {
                navigate(`/orders/add?client=${data.id}`);
            } else {
                handleReset();
            }
        } catch (error) {
            console.error("Error creating client:", error);
            message.error("Failed to create client");
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

    return (
        <Card>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={loading}
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
                                onSelect={handleCompanySelect}
                                selectedValue={selectedCompanyId}
                                placeholder="Select a company"
                                fetchFunction={async (page, rowsPerPage, passedFilter) => {
                                    return getCompanies(page, rowsPerPage, passedFilter).then((result) => ({
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
                        >
                            <DynamicDropdownMenu
                                key={selectedCompanyId || "no-company"}
                                onSelect={handleBrandSelect}
                                selectedValue={selectedBrandId}
                                placeholder="Select a brand (optional)"
                                disabled={!selectedCompanyId}
                                fetchFunction={async (page, rowsPerPage, passedFilter) => {
                                    if (!selectedCompanyId) {
                                        return { pagination: {}, data: [] };
                                    }
                                    return getBrands(selectedCompanyId, page, rowsPerPage, passedFilter).then((result) => ({
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
                            name="firstName"
                            label="First Name"
                            rules={[
                                {
                                    required: true,
                                    message: "First name is required",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter first name"
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="lastName"
                            label="Last Name"
                            rules={[
                                {
                                    required: true,
                                    message: "Last name is required",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter last name"
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="address1"
                            label="Address Line 1"
                            rules={[
                                {
                                    required: true,
                                    message: "Address line 1 is required",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter address line 1"
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="address2" label="Address Line 2">
                            <Input
                                placeholder="Enter address line 2"
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="zipCode"
                            label="ZIP/Postal Code"
                            rules={[
                                {
                                    required: true,
                                    message: "ZIP/Postal code is required",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter ZIP/postal code"
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Form.Item name="city" label="City">
                            <Input placeholder="Enter city" maxLength={255} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="country"
                            label="Country"
                            rules={[
                                {
                                    required: true,
                                    message: "Country is required",
                                },
                            ]}
                        >
                            <CountryDropdown
                                onChange={(country) => {
                                    console.log("Selected country:", country);
                                    form.setFieldsValue({
                                        country: country,
                                    });
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

      <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="phone" label="Phone">
                            <Input placeholder="Enter phone" maxLength={255} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="gender" label="Gender">
                            <Select placeholder="Select gender">
                                <Select.Option value="male">Male</Select.Option>
                                <Select.Option value="female">
                                    Female
                                </Select.Option>
                                <Select.Option value="not sure">
                                    Not Sure
                                </Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

          

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="state" label="State">
                            <Input placeholder="Enter state" maxLength={255} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="address3" label="Address Line 3">
                            <Input
                                placeholder="Enter address line 3"
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="listOwner" label="Enter List Owner">
                            <Input placeholder="List Owner" maxLength={255} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="birthDate" label="Date of Birth">
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px",
                            marginTop: "20px",
                        }}
                    >
                        <Button onClick={handleReset}>Reset</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            Create Client
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default ClientForm;
