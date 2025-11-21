import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { message, Row, Col, Card, Button } from "antd";
import PageHeader from "../../components/ui/PageHeader";
import EnrolledClientsTable from "../../components/clients/EnrolledClientsTable";
import ChainDropdownMenu from "../../components/chains/ChainDropdownMenu";
import { getMailFiles } from "../../api/offer";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

/// Mail files table
function EncrolledClients() {
    const [enrolledClients, setEnrolledClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
    });

    // Filter states
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedChain, setSelectedChain] = useState(null);

    // Use global brand filter from header
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    // Fetch enrolled clients data
    async function fetchEnrolledClients() {
        setLoading(true);
        try {
            // Pass pagination and filter parameters to the API call
            const params = {
                page: pagination.current,
                rows_per_page: pagination.pageSize,
            };

            // Add filters if selected
            if (selectedCampaign) {
                params.campaign_id = selectedCampaign.id;
            }
            if (selectedChain) {
                params.chain_id = selectedChain.id;
            }

            // Build filters object for brand only
            const filters = {};

            filters.brandId = [{ in: selectedBrandIds }];

            if (Object.keys(filters).length > 0) {
                params.filters = filters;
            }

            const result = await getMailFiles(params);

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            setEnrolledClients(result.data || []);
            setPagination((prev) => ({
                ...prev,
                total: result.pagination?.total || 0,
            }));
        } catch (error) {
            console.error("Error fetching enrolled clients:", error);
            message.error("Failed to load enrolled clients");
        } finally {
            setLoading(false);
        }
    }

    // Initial data fetch and refetch when filters change
    useEffect(() => {
        fetchEnrolledClients();
    }, [
        pagination.current,
        pagination.pageSize,
        selectedCampaign,
        selectedChain,
        selectedBrandIds,
        brands.length,
    ]);

    // Handle table pagination change
    function handleTableChange(paginationParams) {
        setPagination((prev) => ({
            ...prev,
            current: paginationParams.current,
            pageSize: paginationParams.pageSize,
        }));
    }

    // Handle campaign selection
    function handleCampaignSelect(campaign) {
        setSelectedChain(null); // Reset chain when campaign changes
        setSelectedCampaign(campaign);
        setPagination((prev) => ({ ...prev, current: 1 })); // Reset to first page
    }

    // Handle chain selection
    function handleChainSelect(chain) {
        setSelectedChain(chain);
        setPagination((prev) => ({ ...prev, current: 1 })); // Reset to first page
    }

    // Clear all filters
    function handleClearFilters() {
        setSelectedCampaign(null);
        setSelectedChain(null);
        setPagination((prev) => ({ ...prev, current: 1 })); // Reset to first page
    }

    return (
        <div className="container-fluid py-4">
            <PageHeader title="Database Codes" />

            {/* Filter Section
            <Card className="mb-4">
                <Row gutter={[16, 16]} className='justify-content-between px-4'>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                Filter by Campaign:
                            </label>
                            <CampaignDropdownMenu
                                onSelect={handleCampaignSelect}
                                selectedValue={selectedCampaign?.id}
                                placeholder="Select Campaign"
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                Filter by Chain:
                            </label>
                            <ChainDropdownMenu
                                campaignId={selectedCampaign?.id}
                                onSelect={handleChainSelect}
                                selectedValue={selectedChain?.id}
                                placeholder="Select Chain"
                                disabled={!selectedCampaign}
                            />
                        </div>
                    </Col>

                    <Col xs={24} sm={24} md={8} lg={6} className="d-flex align-items-end justify-content-end">
                        <Button 
                            onClick={handleClearFilters}
                            disabled={!selectedCampaign && !selectedChain}
                            style={{ marginBottom: '8px' }}
                        >
                            Clear Filters
                        </Button>
                    </Col>
                </Row>
            </Card> */}

            <EnrolledClientsTable
                enrolledClients={enrolledClients}
                loading={loading}
                pagination={pagination}
                onTableChange={handleTableChange}
                onRefresh={fetchEnrolledClients}
            />
        </div>
    );
}

export default EncrolledClients;
