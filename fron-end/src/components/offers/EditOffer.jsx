import { useState, useMemo, useRef, useEffect } from "react";
import {
    Form,
    Input,
    Select,
    Button,
    message,
    Divider,
    Row,
    Col,
} from "antd";
import { updateOffer } from "../../api/offer";
import CountryDropdown from "../ui/CountryDropdown";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { sendGermany } from "../../util/germanyConverter";
import { getAddresses } from "../../api/addresses";
import { getPayeeNames } from "../../api/payeeNames";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";

function EditOffer({ offer, onSuccess, onCancel }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(offer?.country || null);
    const [selectedReturnAddress, setSelectedReturnAddress] = useState(offer?.returnAddress || null);
    const [selectedPayeeName, setSelectedPayeeName] = useState(offer?.payeeName || null);
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        offer?.brand?.companyId || offer?.company?.id || null
    );
    const [selectedBrandId, setSelectedBrandId] = useState(
        offer?.brandId || offer?.brand?.id || null
    );
    
    // Store original data for comparison to only send changed fields
    const originalData = useRef({});

    // Initialize originalData with offer data
    useEffect(() => {
        if (offer) {
            const companyId = offer?.brand?.companyId || offer?.company?.id || null;
            const brandId = offer?.brandId || offer?.brand?.id || null;
            
            originalData.current = { 
                ...offer,
                companyId,
                brandId,
            };
            
            // Set form initial values
            form.setFieldsValue({
                title: offer.title,
                description: offer.description,
                porter: offer.porter,
                owner: offer.owner,
                theme: offer.theme,
                grade: offer.grade,
                language: offer.language,
                version: offer.version,
                origin: offer.origin,
                country: offer.country,
                printer: offer.printer,
                type: offer.type,
                companyId,
                brandId,
            });
            
            // Set selected values for dropdowns
            setSelectedCountry(offer.country);
            setSelectedReturnAddress(offer.returnAddress);
            setSelectedPayeeName(offer.payeeName);
            setSelectedCompanyId(companyId);
            setSelectedBrandId(brandId);
        }
    }, [offer, form]);

    // Memoize extraArgs to prevent unnecessary re-renders
    const addressExtraArgs = useMemo(() => [
        { filters: { status: [{ ne: "closed" }] } },
    ], []);

    // Handle form submission
    async function handleSubmit(values) {
        setLoading(true);
        try {
            // Only send fields that have changed
            const changedValues = {};
            
            // Check which fields have changed
            Object.keys(values).forEach(key => {
                if (values[key] !== originalData.current[key]) {
                    changedValues[key] = values[key];
                }
            });
            
            // Check if country has changed
            if (selectedCountry !== originalData.current.country) {
                changedValues.country = sendGermany(selectedCountry);
            }
            
            // Check if return address has changed
            if (selectedReturnAddress?.id !== originalData.current.returnAddressId) {
                changedValues.returnAddressId = selectedReturnAddress?.id;
            }
            
            // Check if payee name has changed
            if (selectedPayeeName?.id !== originalData.current.payeeNameId) {
                changedValues.payeeNameId = selectedPayeeName?.id;
            }
            
            // Check if brand has changed
            const originalBrandId = originalData.current?.brandId || originalData.current?.brand?.id || null;
            if (selectedBrandId !== originalBrandId) {
                changedValues.brandId = selectedBrandId;
            }
            
            // Validate brand is selected
            if (!selectedBrandId) {
                message.error("Please select a brand");
                form.setFields([{ name: 'brandId', errors: ['Please select a brand'] }]);
                setLoading(false);
                return;
            }
            
            // If there are no changes, show a message and return
            if (Object.keys(changedValues).length === 0) {
                message.info("No changes detected");
                onCancel();
                return;
            }

            // Send only changed values to the API
            const result = await updateOffer(offer.id, { payload: changedValues });
            
            if (typeof result === "string") {
                message.error(result);
                return;
            }
            
            message.success("Offer updated successfully");
            onSuccess();
        } catch (error) {
            console.error("Error updating offer:", error);
            message.error("Failed to update offer");
        } finally {
            setLoading(false);
        }
    }
    
    // Handle payee name selection
    function handlePayeeNameSelect(payeeName) {
        setSelectedPayeeName(payeeName);
        form.setFieldsValue({ payeeNameId: payeeName?.id || null });
    }

    // Handle company selection
    function handleCompanySelect(company) {
        const companyId = company?.id || null;
        setSelectedCompanyId(companyId);
        setSelectedBrandId(null); // Reset brand when company changes
        form.setFieldsValue({ 
            companyId: companyId,
            brandId: null 
        });
        form.validateFields(['brandId']).catch(() => {});
    }

    // Handle brand selection
    function handleBrandSelect(brand) {
        const brandId = brand?.id || null;
        setSelectedBrandId(brandId);
        form.setFieldsValue({ brandId: brandId });
        form.validateFields(['brandId']).catch(() => {});
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={loading}
        >
            <Form.Item
                name="title"
                label="Offer Code"
                rules={[
                    { required: true, message: "Please enter offer code" },
                ]}
            >
                <Input placeholder="Enter offer code" />
            </Form.Item>

            <Form.Item name="type" label="Offer Type">
                <Select placeholder="Select Offer Type">
                    <Select.Option value="offer">Offer</Select.Option>
                    <Select.Option value="client-services">
                        Client Services
                    </Select.Option>
                    <Select.Option value="product">Product</Select.Option>
                    <Select.Option value="payment-reminder">
                        Payment Reminder
                    </Select.Option>
                </Select>
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
                            placeholder="Select Company"
                            fetchFunction={(page, rowsPerPage, passedFilter) =>
                                getCompanies(page, rowsPerPage, passedFilter).then((result) => ({
                                    pagination: result?.pagination || {},
                                    data: result?.data || [],
                                }))
                            }
                            searchBy="name"
                            setOptions={(data) => data.map((c) => ({ value: c.id, label: c.name || `Company ${c.id}` }))}
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
                                    ? "Select Brand"
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
                            setOptions={(data) => data.map((b) => ({ value: b.id, label: b.name || `Brand ${b.id}` }))}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="description" label="Description">
                <Input.TextArea
                    placeholder="Enter offer description"
                    rows={4}
                />
            </Form.Item>

            <Form.Item name="porter" label="Porter">
                <Input placeholder="Enter porter" />
            </Form.Item>

            <Form.Item name="owner" label="Owner">
                <Input placeholder="Enter owner" />
            </Form.Item>

            <Form.Item name="theme" label="Theme">
                <Input placeholder="Enter theme" />
            </Form.Item>

            <Form.Item name="grade" label="Grade">
                <Input placeholder="Enter grade" />
            </Form.Item>

            <Form.Item name="language" label="Language">
                <Input placeholder="Enter language" />
            </Form.Item>

            <Form.Item name="version" label="Version">
                <Input placeholder="Enter version" />
            </Form.Item>

            <Form.Item name="origin" label="Origin">
                <Input placeholder="Enter origin" />
            </Form.Item>

            <Form.Item required name="country" label="Country">
                <CountryDropdown
                    value={selectedCountry}
                    disabled={loading}
                    onChange={(country) => setSelectedCountry(country)}
                />
            </Form.Item>

            {/* <Form.Item label="Return Address">
                <DynamicDropdownMenu
                    onSelect={(address) =>
                        setSelectedReturnAddress(address)
                    }
                    extraArgs={addressExtraArgs}
                    selectedValue={selectedReturnAddress?.id}
                    placeholder="Select a PO Box address"
                    fetchFunction={getAddresses}
                    searchBy="address"
                    setOptions={(data) => {
                        return data.map((address) => ({
                            value: address.id,
                            label: address.country
                                ? `${address?.address} - ${address?.country}`
                                : address.address,
                            address,
                        }));
                    }}
                />
            </Form.Item>
             */}
            {/* <Form.Item name="printer" label="Printer">
                <Input placeholder="Enter printer name or identifier" />
            </Form.Item> */}

            {/* <Form.Item name="payeeNameId" label="Payee Name">
                <DynamicDropdownMenu
                    onSelect={handlePayeeNameSelect}
                    selectedValue={selectedPayeeName?.id}
                    placeholder="Select a payee name"
                    fetchFunction={getPayeeNames}
                    searchBy="name"
                    setOptions={(data) => {
                        return data.map((payeeName) => ({
                            value: payeeName.id,
                            label: payeeName.name || `Payee ${payeeName.id}`,
                            address: payeeName,
                        }));
                    }}
                />
            </Form.Item> */}

            <Divider />

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px",
                }}
            >
                <Button onClick={onCancel}>Cancel</Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                >
                    Update Offer
                </Button>
            </div>
        </Form>
    );
}

export default EditOffer;
