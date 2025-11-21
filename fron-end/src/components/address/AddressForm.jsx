import { useState, useRef } from "react";
import { Form, Input, Select, Button, Card, message, DatePicker } from "antd";
import { createAddress, updateAddress } from "../../api/addresses";
import CountryDropdown from "../ui/CountryDropdown";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import { sendGermany } from "../../util/germanyConverter";
import dayjs from "dayjs";

function AddressForm({ initialValues = {}, onSubmit, onCancel }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(
        initialValues?.country || null
    );
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        initialValues?.companyId || initialValues?.company?.id || null
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
            companyId:
                initialValues?.companyId || initialValues?.company?.id || null,
            brandId: initialValues?.brandId || initialValues?.brand?.id || null,
        };
    }

    // Handle form submission
    async function handleSubmit(values) {
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

                // If no changes, don't submit
                if (Object.keys(changedData).length === 0) {
                    message.info("No changes made");
                    setLoading(false);
                    return;
                }

                // Format date if it changed
                if (changedData.openingDate) {
                    changedData.openingDate =
                        changedData.openingDate.format("YYYY-MM-DD");
                }

                // Include brandId if it changed
                const originalBrandId =
                    originalData.current?.brandId ||
                    originalData.current?.brand?.id ||
                    null;
                if (selectedBrandId !== originalBrandId) {
                    changedData.brandId = selectedBrandId;
                }

                await onSubmit(changedData);
            } else {
                // Create mode - default behavior
                const formattedValues = {
                    address: values.address,
                    country: sendGermany(selectedCountry),
                    status: values.status || "normal",
                    comment: values.comment,
                    poBoxNumber: values.poBoxNumber,
                    ManagerAtBluescale: values.ManagerAtBluescale,
                    openingDate: values.openingDate
                        ? values.openingDate.format("YYYY-MM-DD")
                        : null,
                    teamNameContact: values.teamNameContact,
                    poBoxEmail: values.poBoxEmail,
                    brandId: selectedBrandId || null,
                };

                console.log(formattedValues);
                const response = await createAddress(formattedValues);

                if (typeof response === "string") {
                    message.error(response);
                    return;
                }

                message.success("Address created successfully");

                // Reset the form
                handleReset();
                setSelectedCountry(null);

                // Call the callback if provided
                onSubmit?.();
            }
        } catch (error) {
            console.error(
                `Error ${isUpdateMode ? "updating" : "creating"} address:`,
                error
            );
            message.error(
                `Failed to ${isUpdateMode ? "update" : "create"} address`
            );
        } finally {
            setLoading(false);
        }
    }

    // Handle form reset
    function handleReset() {
        form.resetFields();
        setSelectedCountry(null);
        setSelectedCompanyId(null);
        setSelectedBrandId(null);
    }

    // Track changes in form fields for update mode
    const handleValuesChange = (changedValues, allValues) => {
        if (isUpdateMode) {
            // Store original data for comparison on first change
            if (Object.keys(originalData.current).length === 0) {
                originalData.current = { ...allValues };
            }
            // Update the form with new values
            form.setFieldsValue(allValues);
        }
    };

    // Handle country selection
    const handleCountryChange = (country) => {
        setSelectedCountry(country);
        if (isUpdateMode) {
            form.setFieldsValue({ country });
        }
    };

    // Handle company selection
    const handleCompanySelect = (company) => {
        const companyId = company?.id || null;
        setSelectedCompanyId(companyId);
        // Update form field value so validation works
        form.setFieldsValue({ companyId: companyId });
        // Trigger validation to clear any error messages
        form.validateFields(["companyId"]);
        // Reset brand when company changes
        setSelectedBrandId(null);
        form.setFieldsValue({ brandId: null });
    };

    // Handle brand selection
    const handleBrandSelect = (brand) => {
        const brandId = brand?.id || null;
        setSelectedBrandId(brandId);
        form.setFieldsValue({ brandId: brandId });
        form.validateFields(["brandId"]);
    };

    // Convert date string to dayjs object for initial values
    const processedInitialValues = { ...initialValues };
    if (
        initialValues?.openingDate &&
        typeof initialValues.openingDate === "string"
    ) {
        processedInitialValues.openingDate = dayjs(initialValues.openingDate);
    }
    // Set companyId from nested object if present
    if (initialValues?.company?.id && !processedInitialValues.companyId) {
        processedInitialValues.companyId = initialValues.company.id;
    }
    // Set brandId from nested object if present
    if (initialValues?.brand?.id && !processedInitialValues.brandId) {
        processedInitialValues.brandId = initialValues.brand.id;
    }

    return (
        <Card>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={handleValuesChange}
                disabled={loading}
                initialValues={{
                    status: "normal",
                    ...processedInitialValues,
                }}
            >
                <Form.Item
                    name="address"
                    label="Address"
                    rules={[
                        { required: true, message: "Please enter address" },
                    ]}
                >
                    <Input placeholder="Enter address" />
                </Form.Item>

                <Form.Item label="Select the country">
                    <CountryDropdown
                        value={selectedCountry}
                        onChange={handleCountryChange}
                    />
                </Form.Item>

                <Form.Item
                    name="companyId"
                    label="Company"
                    rules={[
                        { required: true, message: "Please select a company" },
                    ]}
                >
                    <DynamicDropdownMenu
                        onSelect={handleCompanySelect}
                        selectedValue={selectedCompanyId}
                        placeholder="Select a company"
                        fetchFunction={async (
                            page,
                            rowsPerPage,
                            passedFilter
                        ) => {
                            const result = await getCompanies(
                                page,
                                rowsPerPage,
                                passedFilter
                            );
                            return {
                                pagination: result?.pagination || {},
                                data: result?.data || [],
                            };
                        }}
                        searchBy="name"
                        setOptions={(data) => {
                            return data.map((c) => ({
                                value: c.id,
                                label: c.name || `Company ${c.id}`,
                            }));
                        }}
                    />
                </Form.Item>

                <Form.Item
                    name="brandId"
                    label="Brand"
                    rules={[
                        { required: true, message: "Please select a brand" },
                    ]}
                >
                    <DynamicDropdownMenu
                        key={`brand-${selectedCompanyId}`}
                        disabled={!selectedCompanyId}
                        onSelect={handleBrandSelect}
                        selectedValue={selectedBrandId}
                        placeholder="Select a brand"
                        fetchFunction={async (
                            page,
                            rowsPerPage,
                            passedFilter
                        ) => {
                            const result = await getBrands(
                                selectedCompanyId,
                                page,
                                rowsPerPage,
                                passedFilter
                            );
                            return {
                                pagination: result?.pagination || {},
                                data: result?.data || [],
                            };
                        }}
                        searchBy="name"
                        setOptions={(data) => {
                            return data.map((b) => ({
                                value: b.id,
                                label: b.name,
                            }));
                        }}
                    />
                </Form.Item>

                <Form.Item
                    name="status"
                    label="Status"
                    rules={[
                        { required: true, message: "Please select status" },
                    ]}
                >
                    <Select placeholder="Select status">
                        <Select.Option value="normal">Normal</Select.Option>
                        <Select.Option value="closed">Closed</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item name="comment" label="Comment">
                    <Input.TextArea placeholder="Enter comment" rows={3} />
                </Form.Item>

                <Form.Item name="poBoxNumber" label="PO Box Number">
                    <Input placeholder="Enter PO Box number" />
                </Form.Item>

                <Form.Item
                    name="ManagerAtBluescale"
                    label="Manager at Bluescale"
                >
                    <Input placeholder="Enter manager name" />
                </Form.Item>

                <Form.Item name="openingDate" label="Opening Date">
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="teamNameContact" label="Team Name Contact">
                    <Input placeholder="Enter team name contact" />
                </Form.Item>

                <Form.Item
                    name="poBoxEmail"
                    label="PO Box Email"
                    rules={[
                        {
                            type: "email",
                            message: "Please enter a valid email",
                        },
                    ]}
                >
                    <Input placeholder="Enter PO Box email" />
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
                            {isUpdateMode ? "Update Address" : "Create Address"}
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default AddressForm;
