import { useState, useEffect } from "react";
import {
    Form,
    Select,
    Input,
    DatePicker,
    InputNumber,
    Row,
    Col,
    Button,
    Divider,
    Space,
    Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import KeyCodeInput from "./KeyCodeInput";

/**
 * FilterItem component for creating a filter group with multiple conditions
 * @param {Object} props
 * @param {Array} props.clientColumns - Available columns to filter by
 * @param {Object} props.availableFilters - Available filter types for each column
 * @param {Object} props.filterData - Current filter data
 * @param {Function} props.onChange - Function to call when filter changes
 * @param {Function} props.onRemove - Function to call when filter is removed
 * @param {number} props.index - Index of this filter in the filters array
 */
function FilterItem({
    clientColumns,
    availableFilters,
    filterData = {},
    onChange,
    onRemove,
    index,
}) {
    const { Text } = Typography;

    // Initialize filter rows with default or provided data
    const [filterRows, setFilterRows] = useState(
        filterData.filterRows || [{ column: "", filterType: "", value: "" }]
    );

    // Key code state
    const [keyCode, setKeyCode] = useState(
        filterData.keyCode || { value: "", keyCodeExists: false }
    );

    // Initialize with props - only on mount
    useEffect(() => {
        if (
            filterData &&
            filterData.filterRows &&
            filterData.filterRows.length > 0
        ) {
            setFilterRows(filterData.filterRows);
        }
        if (filterData && filterData.keyCode) {
            setKeyCode(filterData.keyCode);
        }
    }, []);

    // Create and return the current filter data structure
    function createFilterData(currentRows, currentKeyCode) {
        // Use the provided rows and keyCode or fall back to state
        const rows = currentRows || filterRows;
        const kCode = currentKeyCode || keyCode;

        // Prepare filter structure
        const filterStructure = {};

        // Process each filter row
        rows.forEach((row) => {
            if (row.column && row.filterType && row.value) {
                if (!filterStructure[row.column]) {
                    filterStructure[row.column] = [];
                }

                // Add the filter condition
                const condition = {};
                condition[row.filterType] = row.value;
                filterStructure[row.column].push(condition);
            }
        });

        // Create the complete filter item data
        return {
            filterRows: rows,
            filterStrcuture: filterStructure,
            keyCode: kCode,
        };
    }

    // When any value changes, notify parent with current state
    function notifyParent(currentRows, currentKeyCode) {
        if (onChange) {
            const updatedFilterData = createFilterData(
                currentRows,
                currentKeyCode
            );
            onChange(index, updatedFilterData);
        }
    }

    // Handle key code change
    function handleKeyCodeChange(value) {
        const newKeyCode = value;
        setKeyCode(newKeyCode);
        notifyParent(null, newKeyCode);
    }

    // Add a new filter row
    function addFilterRow() {
        const newRows = [
            ...filterRows,
            { column: "", filterType: "", value: "" },
        ];
        setFilterRows(newRows);
        notifyParent(newRows, null);
    }

    // Remove a filter row
    function removeFilterRow(rowIndex) {
        let newRows;
        if (filterRows.length <= 1) {
            // Don't remove the last row, just clear it
            newRows = [{ column: "", filterType: "", value: "" }];
        } else {
            newRows = filterRows.filter((_, i) => i !== rowIndex);
        }
        setFilterRows(newRows);
        notifyParent(newRows, null);
    }

    // Handle changes to a filter row
    function handleRowChange(rowIndex, field, value) {
        const newRows = [...filterRows];
        newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };

        // If column changes, reset filterType and value
        if (field === "column") {
            newRows[rowIndex].filterType = "";
            newRows[rowIndex].value = "";
        }

        setFilterRows(newRows);
        notifyParent(newRows, null);
    }

    // Get column options for the dropdown
    const columnOptions = clientColumns.map((column) => ({
        label: column.charAt(0).toUpperCase() + column.slice(1),
        value: column,
    }));

    // Get filter type options based on column
    function getFilterTypeOptions(column) {
        return column && availableFilters[column]?.filters
            ? availableFilters[column].filters.map((filter) => ({
                  label: filter.label,
                  value: filter.value,
              }))
            : [];
    }

    // Render the appropriate input based on column type
    function renderValueInput(rowIndex, row) {
        if (!row.column || !row.filterType) return null;

        const filterConfig = availableFilters[row.column];
        if (!filterConfig) return null;

        switch (filterConfig.type) {
            case "select":
                return (
                    <Select
                        placeholder="Select value"
                        options={filterConfig.options}
                        value={row.value}
                        onChange={(value) =>
                            handleRowChange(rowIndex, "value", value)
                        }
                        style={{ width: "100%" }}
                    />
                );
            case "date":
                return (
                    <DatePicker
                        style={{ width: "100%" }}
                        onChange={(date) => {
                            const formattedDate = date
                                ? date.format("YYYY-MM-DD")
                                : "";
                            handleRowChange(rowIndex, "value", formattedDate);
                        }}
                    />
                );
            case "number":
                return (
                    <InputNumber
                        style={{ width: "100%" }}
                        placeholder="Enter value"
                        value={row.value}
                        onChange={(value) =>
                            handleRowChange(rowIndex, "value", value)
                        }
                    />
                );
            case "input":
            default:
                return (
                    <Input
                        placeholder="Enter value"
                        value={row.value}
                        onChange={(e) =>
                            handleRowChange(rowIndex, "value", e.target.value)
                        }
                    />
                );
        }
    }

    return (
        <div
            className="filter-item"
            style={{
                border: "1px solid #f0f0f0",
                padding: "16px",
                marginBottom: "16px",
                borderRadius: "4px",
            }}
        >
            <Row justify="space-between" align="middle" style={{ marginBottom: "16px" }}>
                {/* <Col>
                    <Text strong>Filter Group {index + 1}</Text>
                </Col> */}
                {/* <Col>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onRemove(index)}
                        title="Delete this filter group"
                    >
                        Delete Group
                    </Button>
                </Col> */}
            </Row>
            
            <KeyCodeInput value={keyCode} onChange={handleKeyCodeChange} />
            <Divider style={{ margin: "12px 0" }} />

            {/* Filter rows */}
            {filterRows.map((row, rowIndex) => (
                <div
                    key={rowIndex}
                    style={{
                        marginBottom:
                            rowIndex < filterRows.length - 1 ? "16px" : 0,
                    }}
                >
                    {rowIndex > 0 && (
                        <Text
                            type="secondary"
                            style={{ display: "block", marginBottom: "8px" }}
                        >
                            AND
                        </Text>
                    )}
                    <Row gutter={16} align="middle" justify="center">
                        <Col span={7}>
                            <Form.Item
                                label="Filter By"
                                style={{ marginBottom: 8 }}
                            >
                                <Select
                                    placeholder="Select column"
                                    options={columnOptions}
                                    value={row.column}
                                    onChange={(value) =>
                                        handleRowChange(
                                            rowIndex,
                                            "column",
                                            value
                                        )
                                    }
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={7}>
                            <Form.Item
                                label="How to Filter"
                                style={{ marginBottom: 8 }}
                            >
                                <Select
                                    placeholder="Select filter type"
                                    options={getFilterTypeOptions(row.column)}
                                    value={row.filterType}
                                    onChange={(value) =>
                                        handleRowChange(
                                            rowIndex,
                                            "filterType",
                                            value
                                        )
                                    }
                                    style={{ width: "100%" }}
                                    disabled={!row.column}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Value"
                                style={{ marginBottom: 8 }}
                            >
                                {renderValueInput(rowIndex, row)}
                            </Form.Item>
                        </Col>

                        <Col span={2}>
                            <Form.Item
                                label=" "
                                style={{ marginBottom: 8 }}
                            >
                                <Button
                                    type="primary"
                                    danger
                                    onClick={() => removeFilterRow(rowIndex)}
                                    icon={<DeleteOutlined />}
                                    title="Remove this condition"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            ))}

            {/* Add new filter row button */}
            <Row justify="center" style={{ marginTop: "16px" }}>
                <Button
                    type="dashed"
                    onClick={addFilterRow}
                    icon={<PlusOutlined />}
                >
                    Add Condition
                </Button>
            </Row>
        </div>
    );
}

export default FilterItem;
