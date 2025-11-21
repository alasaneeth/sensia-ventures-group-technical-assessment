// Keep this in sync with client model in the backend and add more columns to filter
import { useState, useEffect } from "react";
import { Card, Typography, Button, Divider, Space, Row, Col } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import FilterItem from "./FilterItem";

// from here
const clientColumns = [
    "gender",
    "city",
    "street",
    "zipCode",
    "address1",
    "address2",
    "address3",
    "address4",
    "address5",
    "birthDate",
    "lastPurchaseDate",
    "totalAmount",
    "totalOrders",
    "totalMails",
];

const equalFilters = [
    {
        label: "Equal",
        value: "eq",
    },
    {
        label: "Not Equal",
        value: "ne",
    },
];

const rangeFilters = (isDate) => [
    {
        label: isDate ? "Exact Before" : "Excatly Less Than",
        value: "lte",
    },
    {
        label: isDate ? "Before" : "Less Than",
        value: "lt",
    },
    {
        label: isDate ? "Exact After" : "Excatly More Than",
        value: "gte",
    },
    {
        label: isDate ? "After" : "More Than",
        value: "gt",
    },
];

const availableFilters = {
    gender: {
        type: "select",
        options: [
            { value: "M", label: "Male" },
            { value: "F", label: "Female" },
        ],
        filters: equalFilters,
    },
    street: {
        type: "input",
        filters: equalFilters,
    },
    city: {
        type: "input",
        filters: equalFilters,
    },
    zipCode: {
        type: "input",
        filters: equalFilters,
    },
    address1: {
        type: "input",
        filters: equalFilters,
    },
    address2: {
        type: "input",
        filters: equalFilters,
    },
    address3: {
        type: "input",
        filters: equalFilters,
    },
    address4: {
        type: "input",
        filters: equalFilters,
    },
    address5: {
        type: "input",
        filters: equalFilters,
    },
    birthDate: {
        type: "date",
        filters: [...equalFilters, ...rangeFilters(true)],
    },
    lastPurchaseDate: {
        type: "date",
        filters: [...equalFilters, ...rangeFilters(true)],
    },
    totalAmount: {
        type: "number",
        filters: [...equalFilters, ...rangeFilters(false)],
    },
    totalOrders: {
        type: "number",
        filters: [...equalFilters, ...rangeFilters(false)],
    },
    totalMails: {
        type: "number",
        filters: [...equalFilters, ...rangeFilters(false)],
    },
};

/**
 * FiltersSection component for managing filters
 * @param {Object} props
 * @param {Function} props.onApplyFilters - Function to call when filters are applied
 */
function FiltersSection({ onApplyFilters }) {
    const { Title } = Typography;

    // State for filters
    const [filters, setFilters] = useState([]);

    // Handle adding a new filter
    function handleAddFilter() {
        setFilters([
            ...filters,
            {
                filterRows: [{ column: "", filterType: "", value: "" }],
                keyCode: { value: "", keyCodeExists: false },
            },
        ]);
    }

    // Handle removing a filter
    function handleRemoveFilter(index) {
        console.log("index: ", index);
        console.log(filters);
        const updatedFilters = [...filters];
        updatedFilters.splice(index, 1);
        setFilters(updatedFilters);
    }

    // Handle updating a filter
    function handleFilterChange(index, filterData) {
        const updatedFilters = [...filters];
        updatedFilters[index] = filterData;
        setFilters(updatedFilters);
    }

    // Handle applying filters
    function handleApplyFilters() {
        // Each filter already has the correct structure from FilterItem
        // We just need to format it for the API

        if (filters.length === 0) {
            // No filters to apply
            return;
        }

        // Call the parent's onApplyFilters function
        if (onApplyFilters) {
            console.log("The filter state: ", filters);
            onApplyFilters(filters);
        }
    }

    return (
        <Card title="Filter Section" className="filter-section-card">
            {/* Filters Container with fixed height and scroll */}
            <div
                className="filters-container"
                style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    marginBottom: "16px",
                    padding: "8px 0",
                }}
            >
                {/* Render filter items */}
                {filters.map((filter, index) => (
                    <FilterItem
                        key={index}
                        index={index}
                        clientColumns={clientColumns}
                        availableFilters={availableFilters}
                        filterData={filter}
                        onChange={handleFilterChange}
                        onRemove={handleRemoveFilter}
                    />
                ))}

                {/* Add Filter Button - Always at the bottom */}
                {filters.length === 0 && (
                    <Row justify="center" style={{ marginTop: "16px" }}>
                        <Button
                            type="dashed"
                            onClick={handleAddFilter}
                            icon={<PlusOutlined />}
                        >
                            Add Filter
                        </Button>
                    </Row>
                )}
            </div>

            {/* Apply Filters Button */}
            <Row justify="end">
                <Button type="primary" onClick={handleApplyFilters}>
                    Apply Filters
                </Button>
            </Row>
        </Card>
    );
}

export default FiltersSection;
