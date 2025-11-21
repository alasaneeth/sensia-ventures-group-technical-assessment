import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Form,
    Input,
    Button,
    Card,
    message,
    Row,
    Col,
} from "antd";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { createCategory, updateCategory } from "../../api/category";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";

function CategoryForm({ initialValues, onSuccess }) {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState(initialValues?.brand?.companyId || null);
    const [selectedBrandId, setSelectedBrandId] = useState(initialValues?.brandId || null);
    
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

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const categoryData = {
                name: values.name,
                brandId: values.brandId,
            };

            if (initialValues?.id) {
                // Update existing category
                const res = await updateCategory(initialValues.id, categoryData);
                if (typeof res === "string") {
                    setLoading(false);
                    return message.error(res);
                }
                message.success("Category updated successfully");
                onSuccess?.();
            } else {
                // Create new category
                const res = await createCategory(categoryData);
                if (typeof res === "string") {
                    setLoading(false);
                    return message.error(res);
                }
                message.success("Category created successfully");
                form.resetFields();
                setSelectedCompanyId(null);
                setSelectedBrandId(null);
            }
        } catch (error) {
            console.error("Error saving category:", error);
            message.error(error?.response?.data?.message || "Failed to save category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={initialValues?.id ? "Update Category" : "Add New Category"}>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                initialValues={initialValues ? {
                    companyId: initialValues.brand?.companyId,
                    brandId: initialValues.brandId,
                    name: initialValues.name,
                } : undefined}
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
                                key={initialValues?.brand?.companyId || "no-initial-company"}
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
                            rules={[
                                {
                                    required: true,
                                    message: "Brand is required",
                                },
                            ]}
                        >
                            <DynamicDropdownMenu
                                key={`${selectedCompanyId || "no-company"}-${initialValues?.brandId || "no-brand"}`}
                                onSelect={handleBrandSelect}
                                selectedValue={selectedBrandId}
                                placeholder="Select a brand"
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
                    <Col xs={24}>
                        <Form.Item
                            name="name"
                            label="Category Name"
                            rules={[
                                {
                                    required: true,
                                    message: "Category name is required",
                                },
                            ]}
                        >
                            <Input placeholder="Enter category name" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        {initialValues?.id ? "Update Category" : "Create Category"}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default CategoryForm;
