import { useState, useMemo } from "react";
import {
    Form,
    Input,
    Select,
    Button,
    Card,
    message,
    Divider,
    Typography,
    Row,
    Col,
    Table,
} from "antd";
import { createOffer } from "../../api/offer";
import CountryDropdown from "../ui/CountryDropdown";
import AddressDropdownMenu from "../address/AddressDropdownMenu";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { sendGermany } from "../../util/germanyConverter";
import { getAddresses } from "../../api/addresses";
import { getPayeeNames } from "../../api/payeeNames";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import { getBundleSkus } from "../../api/bundleSku";

const { Title } = Typography;

function OfferForm() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedReturnAddress, setSelectedReturnAddress] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedBundleSkuIds, setSelectedBundleSkuIds] = useState([]);
    const [selectedBundleSkus, setSelectedBundleSkus] = useState([]);
    const [selectedPayeeName, setSelectedPayeeName] = useState(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState(null);

    // Memoize extraArgs to prevent unnecessary re-renders
    const addressExtraArgs = useMemo(
        () => [{ filters: { status: [{ ne: "closed" }] } }],
        []
    );

    const selectedType = Form.useWatch("type", form);
    const isOfferType = selectedType === "offer";

    // Handle form submission
    async function handleSubmit(values) {
        // Validate company and brand are selected
        if (!selectedCompanyId) {
            message.error("Please select a company");
            form.setFields([
                { name: "companyId", errors: ["Please select a company"] },
            ]);
            setLoading(false);
            return;
        }

        if (!selectedBrandId) {
            message.error("Please select a brand");
            form.setFields([
                { name: "brandId", errors: ["Please select a brand"] },
            ]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Only send fields that match the model
            const formattedValues = {
                title: values.title,
                description: values.description,
                porter: values.porter,
                owner: values.owner,
                theme: values.theme,
                grade: values.grade,
                language: values.language,
                version: values.version,
                origin: values.origin,
                country: sendGermany(selectedCountry),
                returnAddressId: selectedReturnAddress?.id,
                payeeNameId: selectedPayeeName?.id,
                printer: values.printer,
                // Send only bundleSku IDs to backend as `skus`
                skus: selectedBundleSkuIds,
                type: values.type,
                brandId: selectedBrandId, // companyId is accepted from frontend but not stored
            };

            await createOffer(formattedValues);
            message.success("Offer created successfully", 2);

            // Reset the form
            handleReset();
        } catch (error) {
            console.error("Error creating offer:", error);
            message.error("Failed to create offer");
        } finally {
            setLoading(false);
        }
    }

    // Handle form reset
    function handleReset() {
        setSelectedBundleSkuIds([]);
        setSelectedBundleSkus([]);
        setSelectedReturnAddress(null);
        setSelectedPayeeName(null);
        setSelectedCompanyId(null);
        setSelectedBrandId(null);
        form.resetFields();
    }

    // Handle company selection
    function handleCompanySelect(company) {
        setSelectedCompanyId(company?.id || null);
        setSelectedBrandId(null); // Reset brand when company changes
        form.setFieldsValue({
            companyId: company?.id || null,
            brandId: null,
        });
    }

    // Handle brand selection
    function handleBrandSelect(brand) {
        setSelectedBrandId(brand?.id || null);
        form.setFieldsValue({ brandId: brand?.id || null });
    }

    // Handle payee name selection
    function handlePayeeNameSelect(payeeName) {
        setSelectedPayeeName(payeeName);
        form.setFieldsValue({ payeeNameId: payeeName?.id || null });
    }

    // Handle bundle SKU selection from dropdown
    function handleBundleSkuSelect(bundleSku) {
        if (!bundleSku) return;
        setSelectedBundleSkuIds((prevIds) => {
            if (prevIds.includes(bundleSku.id)) return prevIds;
            return [...prevIds, bundleSku.id];
        });
        setSelectedBundleSkus((prev) => {
            if (prev.some((b) => b.id === bundleSku.id)) return prev;
            const newItem = {
                id: bundleSku.id,
                code: bundleSku.code,
                name: bundleSku.name,
                description: bundleSku.description,
                price: bundleSku.price,
                discount: bundleSku.discount,
                currency: bundleSku.currency,
            };
            return [...prev, newItem];
        });
    }

    function handleRemoveBundleSku(bundleSkuId) {
        setSelectedBundleSkuIds((prev) =>
            prev.filter((id) => id !== bundleSkuId)
        );
        setSelectedBundleSkus((prev) =>
            prev.filter((b) => b.id !== bundleSkuId)
        );
    }

    const bundleSkuColumns = [
        {
            title: "Bundle Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Bundle Code",
            dataIndex: "code",
            key: "code",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (value, record) => {
                if (value === null || value === undefined) return "-";
                const currency = record.currency || "€";
                return `${currency} ${Number(value).toFixed(2)}`;
            },
        },
        {
            title: "Discount",
            dataIndex: "discount",
            key: "discount",
            render: (value, record) => {
                if (value === null || value === undefined) return "-";
                const currency = record.currency || "€";
                return `${currency} ${Number(value).toFixed(2)}`;
            },
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Button
                    danger
                    size="small"
                    onClick={() => handleRemoveBundleSku(record.id)}
                >
                    Remove
                </Button>
            ),
        },
    ];

    return (
        <Card>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    status: "draft",
                }}
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
                                    message: "Please select a company",
                                },
                            ]}
                        >
                            <DynamicDropdownMenu
                                onSelect={handleCompanySelect}
                                selectedValue={selectedCompanyId}
                                placeholder="Select Company"
                                fetchFunction={(
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ) =>
                                    getCompanies(
                                        page,
                                        rowsPerPage,
                                        passedFilter
                                    ).then((result) => ({
                                        pagination: result?.pagination || {},
                                        data: result?.data || [],
                                    }))
                                }
                                searchBy="name"
                                setOptions={(data) =>
                                    data.map((c) => ({
                                        value: c.id,
                                        label: c.name || `Company ${c.id}`,
                                    }))
                                }
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
                                            return Promise.reject(
                                                new Error(
                                                    "Please select a brand"
                                                )
                                            );
                                        }
                                        return Promise.resolve();
                                    },
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
                                fetchFunction={async (
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ) => {
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
                                setOptions={(data) =>
                                    data.map((b) => ({
                                        value: b.id,
                                        label: b.name || `Brand ${b.id}`,
                                    }))
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="title"
                            label="Offer Code"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter offer code",
                                },
                            ]}
                        >
                            <Input placeholder="Enter offer code" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="type" label="Offer Type">
                            <Select placeholder="Select Offer Type">
                                <Select.Option value="offer">
                                    Offer
                                </Select.Option>
                                <Select.Option value="client-services">
                                    Client Services
                                </Select.Option>
                                <Select.Option value="product">
                                    Product
                                </Select.Option>
                                <Select.Option value="payment-reminder">
                                    Payement Reminder
                                </Select.Option>
                            </Select>
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
                {/* 
                <Form.Item name="version" label="Version">
                    <Input placeholder="Enter version" />
                </Form.Item> */}

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

                {isOfferType && (
                    <>
                        <Divider orientation="left">Bundle SKUs</Divider>

                        <Form.Item label="Add Bundle SKU to Offer">
                            <DynamicDropdownMenu
                                key={`${selectedBrandId || "no-brand"}-${
                                    selectedBundleSkuIds.length
                                }`}
                                onSelect={handleBundleSkuSelect}
                                placeholder={
                                    selectedBrandId
                                        ? "Select bundle SKU to add"
                                        : "Please select a brand first"
                                }
                                disabled={!selectedBrandId}
                                fetchFunction={async (
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ) => {
                                    if (!selectedBrandId) {
                                        return { pagination: {}, data: [] };
                                    }

                                    const filters = {
                                        ...passedFilter,
                                        brandId: [{ eq: selectedBrandId }],
                                    };

                                    if (selectedBundleSkuIds.length > 0) {
                                        filters.id = [
                                            {
                                                notIn: selectedBundleSkuIds,
                                            },
                                        ];
                                    }

                                    const result = await getBundleSkus(
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
                                setOptions={(data) =>
                                    data.map((bundleSku) => ({
                                        value: bundleSku.id,
                                        label: `${bundleSku.name || ""} - ${
                                            bundleSku.code || ""
                                        }`,
                                        ...bundleSku,
                                    }))
                                }
                            />
                        </Form.Item>

                        <Form.Item label="Selected Bundle SKUs">
                            <Table
                                columns={bundleSkuColumns}
                                dataSource={selectedBundleSkus}
                                rowKey="id"
                                pagination={false}
                                size="small"
                            />
                        </Form.Item>
                    </>
                )}

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
                            Create Offer
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default OfferForm;
