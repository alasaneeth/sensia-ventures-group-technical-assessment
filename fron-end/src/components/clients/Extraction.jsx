import { useState, useRef, useMemo, useEffect } from "react";
import {
    Input,
    Button,
    Modal,
    message,
    Card,
    Space,
    Typography,
    Form,
    DatePicker,
    Select,
    Row,
    Col,
} from "antd";
import {
    FilterOutlined,
    ExportOutlined,
    ClearOutlined,
} from "@ant-design/icons";
import ClientTableV1 from "./ClientTableV1";
import { createKey, fetchCampaigns, extractCampaign } from "../../api/campaign";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import KeyCodes from "../campaigns/KeyCodes";
import { mapAgToApiFilters } from "../../util/tableHelpers";
import CountryDropdown from "../ui/CountryDropdown";
import { useCallback } from "react";
import { sendGermany } from "../../util/germanyConverter";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";
import formatDateForPostgres from "../../util/formatDateForPostgres";

const { Title } = Typography;

// /**
//  * Convert dayjs date object to PostgreSQL acceptable format (MM-DD-YYYY)
//  * @param {Object} dayjsDate - dayjs date object
//  * @returns {string|null} - Formatted date string (MM-DD-YYYY) or null if invalid
//  */
// const formatDateForPostgres = (dayjsDate) => {
//     if (!dayjsDate || dayjsDate.$y === undefined) {
//         return null;
//     }
//     return `${dayjsDate.$M + 1}-${dayjsDate.$D}-${dayjsDate.$y}`;
// };

function Extraction() {
    const [form] = Form.useForm();
    const { selectedBrandIds } = useGlobalCompanyBrandFilter();
    const [segmentationCode, setSegmentationCode] = useState("");
    const [segmentationDescription, setSegmentationDescription] = useState("");
    const [listName, setListName] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [loading, setLoading] = useState(false);
    const [extractLoading, setExtractLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [refreshTable, setRefreshTable] = useState(0);
    const [refreshKeyCodes, setRefreshKeyCodes] = useState(0);
    const [hasUnsavedRow, setHasUnsavedRow] = useState(false);
    const [campaignKeyCodes, setCampaignKeyCodes] = useState([]);
    const [filterChangeCounter, setFilterChangeCounter] = useState(0);
    const [advancedFilters, setAdvancedFilters] = useState({
        lastPurchaseDateFrom: null,
        lastPurchaseDateTo: null,
        totalOrdersOperator: "gte",
        totalOrdersValue: null,
        listOwner: "",
    });
    const [appliedFilters, setAppliedFilters] = useState({
        lastPurchaseDateFrom: null,
        lastPurchaseDateTo: null,
        totalOrdersOperator: "gte",
        totalOrdersValue: null,
        listOwner: "",
    });

    // Separate filters for campaigns and clients
    // Campaign filters
    const campaignFiltersRef = useRef({
        isExtracted: [{ eq: false }],
        ...(selectedCountry ? { country: [{ eq: selectedCountry }] } : {}),
    });

    // Client filters - this will be updated by the ClientTableV1 component
    const clientFiltersRef = useRef({});

    // Reset selected campaign when country filter changes
    useEffect(() => {
        // Reset the selected campaign
        setSelectedCampaign(null);
        form.setFieldsValue({ campaign: undefined });

        // Update campaign filters based on country selection
        if (selectedCountry !== null) {
            // Update the campaign filters with the selected country
            campaignFiltersRef.current = {
                ...campaignFiltersRef.current,
                country: [{ eq: selectedCountry }],
                isExtracted: [{ eq: false }],
            };
        } else {
            // If no country selected, remove country filter but keep isExtracted
            campaignFiltersRef.current = {
                ...campaignFiltersRef.current,
                isExtracted: [{ eq: false }],
            };
            delete campaignFiltersRef.current.country;
        }

        // Force refresh of the campaign dropdown by incrementing the counter
        setFilterChangeCounter((prev) => prev + 1);

        // Also refresh the table to ensure everything is in sync
        setRefreshTable(Date.now());
    }, [selectedCountry, form]);

    // Memoize extraArgs for campaign dropdown to prevent unnecessary re-fetches
    // const campaignExtraArgs = useMemo(() => {
    //     return [
    //         {
    //             filters: {
    //                 isExtracted: [{ eq: false }],
    //                 ...(selectedCountry
    //                     ? { country: [{ eq: selectedCountry }] }
    //                     : {}),
    //             },
    //         },
    //         null, // sortField
    //         null, // sortDirection
    //         { include: 0 },
    //     ];
    // }, [selectedCountry]);

    const fetchFunction = useCallback(
        (page, rowsPerPage, passedFilters) => {
            // Always get the latest campaign filters
            const currentCampaignFilters = { ...campaignFiltersRef.current };

            // Make sure country filter is applied if selectedCountry exists
            if (
                selectedCountry &&
                (!currentCampaignFilters.country ||
                    currentCampaignFilters.country[0]?.eq !== selectedCountry)
            ) {
                currentCampaignFilters.country = [{ eq: selectedCountry }];
            }

            // The filter object for campaigns
            const finalFilter = {
                ...passedFilters,
                ...currentCampaignFilters,
            };

            // Add brand filter from global state
            if (selectedBrandIds && selectedBrandIds.length > 0) {
                finalFilter.brandId = [{ in: selectedBrandIds }];
            }

            console.log("Fetching campaigns with filters:", finalFilter);

            return fetchCampaigns({
                page,
                rowsPerPage,
                filters: finalFilter,
                include: 0, // don't include campaign info I just want the real information
            });
        },
        [filterChangeCounter, selectedCountry, selectedBrandIds] // Include selectedCountry and selectedBrandIds in dependencies
    );

    // To filter the clients
    const clientsFilters = useMemo(() => {
        const filters = {};

        // Merge grid filters from table
        const gridFilters = mapAgToApiFilters(clientFiltersRef.current);
        Object.assign(filters, gridFilters);

        // Set country filter
        if (selectedCampaign?.country) {
            filters.country = [{ eq: selectedCampaign.country }];
        } else if (selectedCountry) {
            filters.country = [{ eq: selectedCountry }];
        }

        // Set blacklist filter
        filters.isBlacklisted = [{ eq: false }];

        // Set brand filter from campaign
        if (selectedCampaign?.brandId) {
            filters.brandId = [{ eq: selectedCampaign.brandId }];
        }

        // Set list owner filter
        if (appliedFilters.listOwner.trim()) {
            filters.listOwner = [{ iLike: `%${appliedFilters.listOwner}%` }];
        }

        // Set last purchase date filters
        if (appliedFilters.lastPurchaseDateFrom) {
            const formattedDate = formatDateForPostgres(appliedFilters.lastPurchaseDateFrom);
            if (formattedDate) {
                filters.lastPurchaseDate = filters.lastPurchaseDate || [];
                filters.lastPurchaseDate.push({
                    gte: formattedDate,
                });
            }
        }
        if (appliedFilters.lastPurchaseDateTo) {
            const formattedDate = formatDateForPostgres(appliedFilters.lastPurchaseDateTo);
            if (formattedDate) {
                filters.lastPurchaseDate = filters.lastPurchaseDate || [];
                filters.lastPurchaseDate.push({
                    lte: formattedDate,
                });
            }
        }

        // Set total orders filter
        if (
            appliedFilters.totalOrdersValue !== null &&
            appliedFilters.totalOrdersValue !== undefined
        ) {
            const operator = appliedFilters.totalOrdersOperator;
            filters.totalOrders = [
                { [operator]: appliedFilters.totalOrdersValue },
            ];
        }

        return filters;
    }, [selectedCampaign, selectedCountry, appliedFilters, filterChangeCounter]);

    // Handle applying advanced filters
    const handleApplyFilters = () => {
        setAppliedFilters(advancedFilters);
        setFilterChangeCounter((prev) => prev + 1);
        message.success("Filters applied successfully");
    };

    // Handle clearing advanced filters
    const handleClearFilters = () => {
        setAdvancedFilters({
            lastPurchaseDateFrom: null,
            lastPurchaseDateTo: null,
            totalOrdersOperator: "gte",
            totalOrdersValue: null,
            listOwner: "",
        });
        setAppliedFilters({
            lastPurchaseDateFrom: null,
            lastPurchaseDateTo: null,
            totalOrdersOperator: "gte",
            totalOrdersValue: null,
            listOwner: "",
        });
        setFilterChangeCounter((prev) => prev + 1);
        message.success("Filters cleared");
    };

    // Handle campaign selection
    const handleCampaignChange = (campaign) => {
        setSelectedCampaign(campaign);
    };

    // Handle add new segmentation row
    const handleAddNewRow = () => {
        if (!selectedCampaign) {
            message.warning("Please select a campaign first");
            return;
        }
        setHasUnsavedRow(true);
        setSegmentationCode("");
        setSegmentationDescription("");
        // Clear any existing filters
        // filtersRef.current = {};
        // setRefreshTable(Date.now());
    };

    // Handle segment button click
    const handleSegmentClick = () => {
        if (!selectedCampaign) {
            message.warning("Please select a campaign");
            return;
        }
        if (!hasUnsavedRow) {
            message.warning("Please add a new segmentation first");
            return;
        }
        setIsModalVisible(true);
    };

    // Handle modal confirmation
    const handleConfirmSegmentation = async () => {
        setLoading(true);
        try {
            // Use synchronized clientsFilters which includes all filters
            const apiFilters = { ...clientsFilters };

            console.log("filters being sent to backend: ", apiFilters);
            // Send null for clients (filter-based segmentation)
            const { success, message: result } = await createKey(
                selectedCampaign?.id, // campaignId
                null, // offerId - will be auto-determined from campaign's first offer
                apiFilters,
                segmentationDescription.trim() || null, // keyCodeDescription
                listName.trim() || null // listName
            );

            if (!success) {
                return message.error(result);
            }

            message.success(result || "Clients segmented successfully");
            setIsModalVisible(false);
            setSegmentationCode("");
            setSegmentationDescription("");
            setListName("");
            setHasUnsavedRow(false);

            // Clear filters and refresh the table
            clientFiltersRef.current = {};
            campaignFiltersRef.current = {
                isExtracted: [{ eq: false }],
                ...(selectedCountry
                    ? { country: [{ eq: selectedCountry }] }
                    : {}),
            };

            // Clear advanced filters
            setAdvancedFilters({
                lastPurchaseDateFrom: null,
                lastPurchaseDateTo: null,
                totalOrdersOperator: "gte",
                totalOrdersValue: null,
                listOwner: "",
            });
            setAppliedFilters({
                lastPurchaseDateFrom: null,
                lastPurchaseDateTo: null,
                totalOrdersOperator: "gte",
                totalOrdersValue: null,
                listOwner: "",
            });

            setRefreshTable(Date.now());

            // Refresh segmentation codes
            setRefreshKeyCodes(Date.now());

            // Reset filter change counter
            setFilterChangeCounter(0);
        } catch (error) {
            console.error("Error segmenting clients:", error);
            message.error(
                error?.response?.data?.message || "Failed to segment clients"
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle modal cancel
    const handleCancelModal = () => {
        setIsModalVisible(false);
    };

    // Handle extract button click
    const handleExtractClick = async () => {
        if (!selectedCampaign) {
            message.warning("Please select a campaign");
            return;
        }

        // Validate that there's at least one segmentation with a list name
        // const hasListName = campaignKeyCodes.some(
        //     (keyCode) => keyCode.listName && keyCode.listName.trim() !== ""
        // );

        // if (!hasListName) {
        //     message.error(
        //         "Cannot extract: No segmentations with list name found. Please add at least one segmentation with a list name before extraction."
        //     );
        //     return;
        // }

        setExtractLoading(true);
        try {
            const result = await extractCampaign(selectedCampaign.id);
            if (typeof result === "string") {
                return message.error(result);
            }

            message.success(
                result.message ||
                    `Successfully extracted ${result.count} clients`
            );

            // Refresh key codes table
            setRefreshKeyCodes(Date.now());
            setSelectedCampaign(null);
            setSelectedCountry(null);
            // Reset form fields
            form.setFieldsValue({
                country: undefined,
                campaign: undefined,
            });
        } catch (error) {
            console.error("Error extracting clients:", error);
            message.error(
                error?.response?.data?.message || "Failed to extract clients"
            );
        } finally {
            setExtractLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <Card>
                <Space
                    direction="vertical"
                    size="large"
                    style={{ width: "100%" }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Title level={3} style={{ margin: 0 }}>
                            Client Segmentation
                        </Title>
                        <Button
                            type="primary"
                            icon={<ExportOutlined />}
                            onClick={handleExtractClick}
                            loading={extractLoading}
                            disabled={!selectedCampaign}
                            size="large"
                        >
                            Extract to Campaign
                        </Button>
                    </div>

                    {/* Country Filter */}
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="country"
                            label="Filter by Country (Optional)"
                        >
                            <CountryDropdown
                                value={selectedCountry}
                                onChange={(value) =>
                                    setSelectedCountry(
                                        sendGermany(value?.toLowerCase())
                                    )
                                }
                            />
                        </Form.Item>
                    </Form>

                    <Form form={form} layout="vertical">
                        {/* Campaign Selection */}
                        <Form.Item
                            name="campaign"
                            label="Select Campaign"
                            rules={[
                                {
                                    required: true,
                                    message: "Please select a campaign",
                                },
                            ]}
                        >
                            <DynamicDropdownMenu
                                key={`campaign-dropdown-${
                                    selectedCountry || "all"
                                }-${filterChangeCounter}`}
                                onSelect={handleCampaignChange}
                                selectedValue={selectedCampaign?.id}
                                placeholder="Select a campaign"
                                // Change this later please
                                fetchFunction={fetchFunction}
                                // extraArgs={campaignExtraArgs}
                                searchBy="code"
                                setOptions={(data) => {
                                    return data.map((c) => ({
                                        value: c.id,
                                        label: c.country
                                            ? `${
                                                  c.code || `Campaign ${c.id}`
                                              } - ${c.country} - ${
                                                  c.mailDate || "No Mail Date"
                                              }`
                                            : `${
                                                  c.code || `Campaign ${c.id}`
                                              } - ${
                                                  c.mailDate || "No Mail Date"
                                              }`,
                                    }));
                                }}
                            />
                        </Form.Item>
                    </Form>
                </Space>

                {/* Segmentation Codes Display */}
                <KeyCodes
                    campaignId={selectedCampaign?.id}
                    refreshTrigger={refreshKeyCodes}
                    onAddNewRow={handleAddNewRow}
                    hasUnsavedRow={hasUnsavedRow}
                    segmentationCode={segmentationCode}
                    setSegmentationCode={setSegmentationCode}
                    segmentationDescription={segmentationDescription}
                    setSegmentationDescription={setSegmentationDescription}
                    listName={listName}
                    setListName={setListName}
                    onKeyCodesChange={setCampaignKeyCodes}
                    onCancelNewRow={() => {
                        setHasUnsavedRow(false);
                        setSegmentationCode("");
                        setSegmentationDescription("");
                        setListName("");
                        // filtersRef.current = {};
                        // setRefreshTable(Date.now());
                    }}
                />
            </Card>

            {selectedCampaign && (
                <>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            margin: "20px 0",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: "16px",
                                fontWeight: 500,
                                color: "#333",
                            }}
                        >
                            {hasUnsavedRow ? (
                                <>
                                    <span>
                                        Apply filters on the table below, then
                                        click 'Segment Clients' button.
                                    </span>{" "}
                                    <i style={{ fontSize: "0.6rem" }}>
                                        (date format: MM-DD-YYYY)
                                    </i>
                                </>
                            ) : (
                                "Click 'Add New Segmentation' to create a new segmentation code."
                            )}
                        </p>
                        {hasUnsavedRow && (
                            <Button
                                type="primary"
                                icon={<FilterOutlined />}
                                onClick={handleSegmentClick}
                                size="large"
                            >
                                Segment Clients
                            </Button>
                        )}
                    </div>

                    {/* Advanced Filters Section */}
                    <Card style={{ marginTop: "20px", marginBottom: "20px" }}>
                        <Title level={4}>Advanced Filters</Title>
                        <Row gutter={16}>
                            <Col xs={24} sm={12} md={6}>
                                <Form.Item label="Last Purchase Date From">
                                    <DatePicker
                                        value={
                                            advancedFilters.lastPurchaseDateFrom
                                        }
                                        onChange={(date) => {
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                lastPurchaseDateFrom: date,
                                            });
                                        }}
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Form.Item label="Last Purchase Date To">
                                    <DatePicker
                                        value={
                                            advancedFilters.lastPurchaseDateTo
                                        }
                                        onChange={(date) => {
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                lastPurchaseDateTo: date,
                                            });
                                        }}
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Form.Item label="Total Orders Operator">
                                    <Select
                                        value={
                                            advancedFilters.totalOrdersOperator
                                        }
                                        onChange={(value) =>
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                totalOrdersOperator: value,
                                            })
                                        }
                                        options={[
                                            { label: "Equal (=)", value: "eq" },
                                            {
                                                label: "Greater Than (>)",
                                                value: "gt",
                                            },
                                            {
                                                label: "Greater or Equal (>=)",
                                                value: "gte",
                                            },
                                            {
                                                label: "Less Than (<)",
                                                value: "lt",
                                            },
                                            {
                                                label: "Less or Equal (<=)",
                                                value: "lte",
                                            },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Form.Item label="Total Orders Value">
                                    <Input
                                        type="number"
                                        placeholder="Enter value"
                                        value={
                                            advancedFilters.totalOrdersValue ??
                                            ""
                                        }
                                        onChange={(e) =>
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                totalOrdersValue: e.target.value
                                                    ? parseInt(e.target.value)
                                                    : null,
                                            })
                                        }
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="List Owner">
                                    <Input
                                        placeholder="Search by list owner"
                                        value={advancedFilters.listOwner}
                                        onChange={(e) =>
                                            setAdvancedFilters({
                                                ...advancedFilters,
                                                listOwner: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col
                                xs={24}
                                md={12}
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "flex-end",
                                }}
                            >
                                <Button
                                    type="primary"
                                    icon={<FilterOutlined />}
                                    onClick={handleApplyFilters}
                                >
                                    Apply Filters
                                </Button>
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={handleClearFilters}
                                >
                                    Clear Filters
                                </Button>
                            </Col>
                        </Row>
                    </Card>

                    {/* Client Table with Filters */}
                    <div style={{ marginTop: "20px" }}>
                        <ClientTableV1
                            key={refreshTable}
                            getFilters={{
                                current: clientFiltersRef.current,
                                onChange: (newFilters) => {
                                    // Update our CLIENT filters reference with the new filters from the table
                                    clientFiltersRef.current = newFilters;
                                    console.log(
                                        "Client filters updated from table:",
                                        newFilters
                                    );
                                    setFilterChangeCounter((prev) => prev + 1);
                                },
                            }}
                            campaignId={selectedCampaign?.id}
                            filters={clientsFilters}
                        />
                    </div>
                </>
            )}

            {/* Confirmation Modal */}
            <Modal
                title="Confirm Segmentation"
                open={isModalVisible}
                onOk={handleConfirmSegmentation}
                onCancel={handleCancelModal}
                confirmLoading={loading}
                okText="Yes, Segment"
                cancelText="Cancel"
            >
                <p>Are you sure you want to segment these clients?</p>
                <p style={{ marginTop: "10px", color: "#666" }}>
                    <strong>Campaign:</strong>{" "}
                    {selectedCampaign?.title || "N/A"}
                </p>
                <p style={{ marginTop: "10px", color: "#666" }}>
                    <strong>Segmentation Code:</strong> <em>Auto-generated</em>
                </p>
                {segmentationDescription && (
                    <p style={{ marginTop: "10px", color: "#666" }}>
                        <strong>Description:</strong> {segmentationDescription}
                    </p>
                )}
                {Object.keys(clientFiltersRef.current).length > 0 && (
                    <p style={{ marginTop: "10px", color: "#666" }}>
                        <strong>Active Client Filters:</strong>{" "}
                        {Object.keys(clientFiltersRef.current).length} filter(s)
                        applied
                    </p>
                )}
            </Modal>
        </div>
    );
}
export default Extraction;
