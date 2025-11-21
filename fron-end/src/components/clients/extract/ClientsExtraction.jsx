import { useState, useEffect } from "react";
import {
    Form,
    Space,
    message,
    Tag,
    Card,
    Row,
    Col,
    Typography,
    Button,
    Alert,
    Divider,
} from "antd";
import ClientTable from "../ClientTable";
import FiltersSection from "./FiltersSection";

/**
 * Client extraction form component
 * @param {Object} props
 * @param {Function} props.onCancel - Function to call when canceling
 * @param {Function} props.onSubmit - Function to call when submitting
 * @param {Function} props.onCampaignChange - Function to call when campaign selection changes
 * @param {Function} props.onClientSelectionChange - Function to call when client selection changes
 */
function ClientsExtraction({
    onCancel,
    onSubmit,
    onCampaignChange,
    onClientSelectionChange,
}) {
    const [selectedClients, setSelectedClients] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [filters, setFilters] = useState({});
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [form] = Form.useForm();

    const { Title } = Typography;

    // Handle client selection change
    function handleClientSelectionChange(clients) {
        setSelectedClients(clients);

        // Notify parent component about client selection change
        if (onClientSelectionChange) {
            onClientSelectionChange(clients);
        }
    };
    // Handle campaign selection change
    function handleCampaignChange(campaign) {
        console.log("This is the campaign: ", campaign);
        setSelectedCampaign(campaign);
        form.setFieldsValue({ campaign: campaign?.id });
        
        // Reset client selection when campaign changes
        setSelectedClients([]);
        
        // Apply country filter if campaign has a country
        if (campaign && campaign.country) {
            const countryFilter = {
                country: [
                    { eq: campaign.country }
                ]
            };
            
            // Update filters with country filter
            setFilters(countryFilter);
            console.log('Applied country filter:', countryFilter);
        } else {
            // Clear filters if no campaign or no country
            setFilters({});
        }
        
        // Notify parent component about campaign selection change
        if (onCampaignChange) {
            onCampaignChange(campaign);
        }
    };
    // Handle extract submission (with selected clients)
    function handleExtractSubmit() {
        if (!selectedCampaign) {
            message.error("Please select a campaign");
            return;
        }

        if (selectedClients.length === 0) {
            message.error("Please select at least one client");
            return;
        }

        // Call the parent's onSubmit function
        if (onSubmit) {
            // Include applied filters in the submission
            console.log("Selected clients: ", selectedClients);
            console.log("Selected campaign: ", selectedCampaign);
            console.log("Applied filters: ", appliedFilters);
            console.log("Combined filters (including country): ", filters);
            
            // Pass the combined filters (including country) to the parent component
            onSubmit(selectedClients, selectedCampaign, filters);
        }
    };
    
    // Handle extract by filters (without selecting individual clients)
    function handleExtractByFilters() {
        if (!selectedCampaign) {
            message.error("Please select a campaign");
            return;
        }
        
        // Check if filters are applied
        if (!filters || Object.keys(filters).length === 0) {
            message.error("Please apply filters before extracting");
            return;
        }
        
        // Call the parent's onSubmit function with filters only
        if (onSubmit) {
            console.log("Extracting by filters");
            console.log("Selected campaign: ", selectedCampaign);
            console.log("Combined filters (including country): ", filters);
            
            // Pass null for clients to indicate filter-based extraction
            onSubmit(null, selectedCampaign, filters);
        }
    }

    // Handle form submission
    function onFinish() {
        handleExtractSubmit();
    };

    // Reset form and selections
    function handleReset() {
        setSelectedClients([]);
        setSelectedCampaign(null);
        setFilters({});
        setAppliedFilters([]);
        form.resetFields();

        if (onCancel) {
            onCancel();
        }
    };
    
    // Handle filter application
    function handleApplyFilters(filterData) {
        console.log('Applied filters:', filterData);
        setAppliedFilters(filterData);
        
        // Create a combined filter structure that includes campaign country
        const updatedFilters = {};
        let hasKeyCode = false;
        
        // Add campaign country filter if available
        if (selectedCampaign && selectedCampaign.country) {
            updatedFilters.country = [
                { eq: selectedCampaign.country }
            ];
        }
        
        // Process user-defined filters if available
        if (filterData && filterData.length > 0) {
            // Process each filter group
            filterData.forEach((filter, index) => {
                if (filter.filterStrcuture) {
                    // Update filters based on the filter structure
                    Object.keys(filter.filterStrcuture).forEach(column => {
                        if (!updatedFilters[column]) {
                            updatedFilters[column] = [];
                        }
                        updatedFilters[column] = [
                            ...updatedFilters[column],
                            ...filter.filterStrcuture[column]
                        ];
                    });
                }
                
                // Check if this filter has a key code
                if (filter.keyCode && filter.keyCode.keyCodeExists && filter.keyCode.value) {
                    hasKeyCode = true;
                    console.log(`Filter ${index + 1} has key code:`, filter.keyCode.value);
                }
            });
        }
        
        console.log('Combined filter structure with country:', updatedFilters);
        console.log('Has key code filters:', hasKeyCode);
        
        // Update the filters state with the combined filters
        setFilters(updatedFilters);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onReset={handleReset}
        >
            <Form.Item
                name="campaign"
                label="Select Campaign"
                rules={[
                    { required: true, message: "Please select a campaign" },
                ]}
            >
                {/* <CampaignDropdownMenu
                    onSelect={handleCampaignChange}
                    filter={true}
                /> */}
            </Form.Item>

            {/* Selection Summary */}
            {/* <Card style={{ marginTop: 16, marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Title level={5}>Selection Summary</Title>
                    </Col>
                    <Col span={12}>
                        <div>
                            <strong>Selected Records:</strong>{" "}
                            <Tag color="blue">{selectedClients.length}</Tag>
                        </div>
                    </Col>
                    <Col span={12}>
                        {selectedCampaign && (
                            <div>
                                <strong>Selected Campaign:</strong>{" "}
                                <Tag color="green">
                                    {selectedCampaign.title}
                                </Tag>
                            </div>
                        )}
                    </Col>
                </Row>
            </Card> */}

            {/* Filters Section */}
            <FiltersSection onApplyFilters={handleApplyFilters} />
            
            <Divider />
            
            {/* Select Records - Only shown when a campaign is selected */}
            {selectedCampaign ? (
                <>
                    {selectedCampaign.country && (
                        <Alert
                            message={`Showing clients from ${selectedCampaign.country}`}
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    <Form.Item label="Select Records">
                        <ClientTable
                            inModal={true}
                            selectable={true}
                            onSelectionChange={handleClientSelectionChange}
                            selectedClients={selectedClients}
                            filters={filters} // This now includes both user filters and campaign country
                            filterEnrolled={true}
                            campaignId={selectedCampaign?.id}
                        />
                    </Form.Item>
                </>
            ) : (
                <Alert
                    message="Please select a campaign to view available clients"
                    type="info"
                    showIcon
                />
            )}

            {/* Submit Buttons */}
            <Row justify="space-between" style={{ marginTop: 16 }}>
                <Space>
                    <Button
                        onClick={(e) => {
                            e.preventDefault(); // Prevent form submission
                            setSelectedClients([]);
                            setSelectedCampaign(null);
                            setFilters({});
                            setAppliedFilters([]);
                            form.resetFields();
                        }}
                    >
                        Reset All
                    </Button>
                </Space>
                <Space>
                    <Button
                        type="primary"
                        onClick={(e) => {
                            e.preventDefault();
                            handleExtractByFilters();
                        }}
                        disabled={!selectedCampaign || Object.keys(filters).length === 0}
                    >
                        Extract by Filters
                    </Button>
                </Space>
            </Row>

            {/* Hidden submit button that can be triggered from parent */}
            <button
                id="extract-form-submit"
                type="submit"
                style={{ display: "none" }}
            />
        </Form>
    );
}

export default ClientsExtraction;
