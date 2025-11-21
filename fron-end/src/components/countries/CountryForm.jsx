import { useState, useRef } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { createCountry, updateCountry } from "../../api/countries";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";

function CountryForm({ initialValues = {}, onSubmit, onCancel }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        initialValues?.brand?.companyId || initialValues?.company?.id || null
    );
    const [selectedBrandId, setSelectedBrandId] = useState(
        initialValues?.brandId || initialValues?.brand?.id || null
    );

    // Store original data for comparison in update mode
    const originalData = useRef({});

    // Determine if this is update mode (has onSubmit callback and initialValues)
    const isUpdateMode = onSubmit && Object.keys(initialValues).length > 0;
    
    // Initialize originalData with initialValues to properly detect changes
    if (isUpdateMode && Object.keys(originalData.current).length === 0) {
        originalData.current = { 
            ...initialValues,
            companyId: initialValues?.brand?.companyId || initialValues?.company?.id || null,
            brandId: initialValues?.brandId || initialValues?.brand?.id || null,
        };
    }

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
            if (isUpdateMode) {
                // Update mode - only send changed data
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

                // If no changes, don't submit
                if (Object.keys(changedData).length === 0) {
                    message.info("No changes made");
                    setLoading(false);
                    return;
                }

                const response = await updateCountry(initialValues.id, changedData);

                if (typeof response === "string") {
                    message.error(response);
                    return;
                }

                message.success("Country updated successfully");
                await onSubmit(changedData);
            } else {
                // Create mode
                const formattedValues = {
                    country: values.country,
                    brandId: selectedBrandId,
                };

                const response = await createCountry(formattedValues);

                if (typeof response === "string") {
                    message.error(response);
                    return;
                }

                message.success("Country created successfully");

                // Reset the form
                handleReset();

                // Call the callback if provided
                onSubmit?.();
            }
        } catch (error) {
            console.error(`Error ${isUpdateMode ? "updating" : "creating"} country:`, error);
            message.error(`Failed to ${isUpdateMode ? "update" : "create"} country`);
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
        // Reset brand when company changes
        setSelectedBrandId(null);
        form.setFieldsValue({ 
            companyId: companyId,
            brandId: null 
        });
        // Clear brand validation error
        form.validateFields(['brandId']).catch(() => {});
    };
    
    // Handle brand selection
    const handleBrandSelect = (brand) => {
        const brandId = brand?.id || null;
        setSelectedBrandId(brandId);
        form.setFieldsValue({ brandId: brandId });
        // Clear validation errors
        form.validateFields(['brandId']).catch(() => {});
    };

    // Set brandId from nested object if present
    const processedInitialValues = { ...initialValues };
    if (initialValues?.brand?.id && !processedInitialValues.brandId) {
        processedInitialValues.brandId = initialValues.brand.id;
    }

    return (
        <Card>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={loading}
                initialValues={processedInitialValues}
            >
                <Form.Item
                    name="country"
                    label="Country"
                    rules={[
                        { required: true, message: "Please enter country name" },
                    ]}
                >
                    <Input placeholder="Enter country name" />
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

                <Form.Item>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px",
                        }}
                    >
                        <Button onClick={onCancel || handleReset}>
                            {isUpdateMode ? "Cancel" : "Reset"}
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            {isUpdateMode ? "Update Country" : "Create Country"}
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default CountryForm;

