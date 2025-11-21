import { Card, Input, Spin, Tag } from "antd";
import OfferTable from "../../offers/OfferTable";
import { useMemo, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
// import ChainTableView from "../../chains/ChainTableView";

const { Search } = Input;
/**
 * OfferSelectionSection component for displaying and handling offer selection
 *
 * @param {Object} props
 * @param {Object} props.selectedChain - The selected client or chain
 * @param {Function} props.onOfferSelect - Handler for offer selection
 * @param {boolean} props.loading - Loading state
 */
function OfferSelectionSection({
    selectedClient,
    onOfferSelect,
    loading = false,
}) {
    const [finalValue, setFinalValue] = useState("");
    const [search, setSearch] = useState("");

    function handleSearch() {
        setFinalValue(search);
        console.log("Hi");
    }

    const filters = useMemo(
        () => ({
            type: [{ eq: "offer" }],
            ...(selectedClient?.country
                ? { country: [{ eq: selectedClient?.country }] }
                : {}),
            ...(finalValue ? { title: [{ iLike: `%${finalValue}%` }] } : {}),
        }),
        [selectedClient, finalValue]
    );

    return (
        <Card
            title="Select an Offer"
            style={{ marginBottom: "24px" }}
            extra={
                selectedClient && (
                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                        }}
                    >
                        <Tag color="blue">
                            Full Name: {selectedClient?.firstName || ""}{" "}
                            {selectedClient?.lastName || ""}
                        </Tag>
                        <Tag color="blue">
                            Address: {selectedClient?.address1 || "N/A"}
                        </Tag>
                        <Tag color="blue">
                            ZIP: {selectedClient?.zipCode || "N/A"}
                        </Tag>
                        <Tag color="blue">
                            City: {selectedClient?.city || "N/A"}
                        </Tag>
                        <Tag color="blue">
                            Country: {selectedClient?.country || "N/A"}
                        </Tag>
                    </div>
                )
            }
        >
            <div style={{ margin: "15px 0px" }}>
                <Search
                    placeholder="Search By Offer code"
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={handleSearch}
                    onChange={(e) => setSearch(e.target.value)}
                    value={search}
                    style={{ marginBottom: "16px" }}
                />
            </div>

            {/* Offer Table with Loading Overlay */}
            <div style={{ position: "relative" }}>
                {loading && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            zIndex: 10,
                            borderRadius: "4px",
                        }}
                    >
                        <Spin size="large" tip="Loading offer details..." />
                    </div>
                )}
                <OfferTable
                    selectable={!loading}
                    onSelect={onOfferSelect}
                    filters={filters}
                    takeNotInChain={false}
                />
            </div>
        </Card>
    );
}

export default OfferSelectionSection;
