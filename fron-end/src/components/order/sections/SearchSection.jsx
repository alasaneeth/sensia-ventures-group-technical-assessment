import { Card, Input, Select, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import ClientTableV1 from "../../clients/ClientTableV1";
import { useGlobalCompanyBrandFilter } from "../../../hooks/useGlobalCompanyBrandFilter";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * SearchSection component for handling search functionality in the PlaceOrder flow
 *
 * @param {Object} props
 * @param {string} props.searchType - Current search type ('code', 'client', or 'zip')
 * @param {Function} props.onSearchTypeChange - Handler for search type changes
 * @param {Function} props.onSearch - Handler for search submissions
 * @param {string} props.searchKey - Unique key for search input (for resetting)
 * @param {string} props.searchValue - Current search value
 * @param {Function} props.setSearchValue - Handler to update search value
 * @param {Object} props.clientFilters - Filters to pass to ClientTableV1
 * @param {Function} props.onClientSelect - Handler for client selection
 */
function SearchSection({
    searchType,
    searchValue,
    onSearchTypeChange,
    onSearch,
    searchKey,
    setSearchValue,
    clientFilters,
    onClientSelect,
}) {
    const { selectedBrandIds } = useGlobalCompanyBrandFilter();

    // Build brand filter and merge with clientFilters
    const mergedFilters = useMemo(() => {
        const brandFilters = {};
        if (selectedBrandIds && selectedBrandIds.length > 0) {
            brandFilters.brandId = [{ in: selectedBrandIds }];
        }
        return {
            ...clientFilters,
            ...brandFilters,
        };
    }, [clientFilters, selectedBrandIds]);

    console.log('\nSEARCH ########  ########\n', searchKey, '\n################\n');
    return (
        <Card style={{ marginBottom: "24px" }}>
            <Title level={4} style={{ marginBottom: "16px" }}>
                {searchType === "code"
                    ? "Enter the Code for the Offer"
                    : "Search for a Client"}
            </Title>
            <div style={{ marginBottom: "16px" }}>
                <Select
                    value={searchType}
                    style={{ width: "200px", marginBottom: "16px" }}
                    onChange={onSearchTypeChange}
                >
                    <Option value="client">By Client Name</Option>
                    <Option value="code">By Code</Option>
                    <Option value="zip">By Zip Code</Option>
                    <Option value="address1,address2,address3">
                        By Address
                    </Option>
                </Select>
            </div>
            <Search
                placeholder={
                    searchType === "code"
                        ? "Enter offer code"
                        : searchType === "client"
                        ? "Enter client name"
                        : searchType === "address1,address2,address3"
                        ? "Enter address"
                        : "Enter zip code"
                }
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={onSearch}
                onChange={(e) => setSearchValue(e.target.value)}
                value={searchValue}
                style={{ marginBottom: "16px" }}
            />

            {searchType !== "code" && clientFilters && (
                <div style={{ marginTop: "24px" }}>
                    <Title level={5} style={{ marginBottom: "16px" }}>
                        Select a Client
                    </Title>
                    <ClientTableV1
                        key={searchKey}
                        filters={mergedFilters}
                        onRowClick={onClientSelect}
                    />
                </div>
            )}
        </Card>
    );
}

export default SearchSection;
