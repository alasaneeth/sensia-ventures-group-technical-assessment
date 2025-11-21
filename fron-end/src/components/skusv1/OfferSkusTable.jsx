import { Table } from "antd";
import { useState, useEffect } from "react";

/**
 * Component to display SKUs associated with an offer with optional row selection capability
 * @param {Array} skus - Array of SKU objects to display
 * @param {boolean} loading - Loading state
 * @param {string} size - Size of the table (small, middle, large)
 * @param {Function} onSelectedSkusChange - Callback function when selected SKUs change
 * @param {Array} selectedSkuIds - Array of pre-selected SKU IDs
 * @param {boolean} selectable - Whether rows are selectable (defaults to true)
 */
function OfferSkusTable({
    skus = [],
    loading = false,
    size = "small",
    onSelectedSkusChange = () => {},
    selectedSkuIds = [],
    selectable = true,
}) {
    // State to track selected row keys (SKU IDs)
    console.log(skus);
    const [selectedRowKeys, setSelectedRowKeys] = useState(selectedSkuIds);

    // Update selected row keys when selectedSkuIds prop changes
    useEffect(() => {
        setSelectedRowKeys(selectedSkuIds);
    }, [selectedSkuIds?.length]);

    // Handle row selection change
    const handleSelectionChange = (selectedKeys, selectedRows) => {
        setSelectedRowKeys(selectedKeys);
        onSelectedSkusChange(selectedKeys, selectedRows);
    };
    const columns = [
        {
            title: "Title",
            dataIndex: "title",
            render: (title) => <span style={{ fontWeight: 500 }}>{title}</span>,
        },
        {
            title: "Description",
            dataIndex: "description",
            ellipsis: true,
            render: (description) => description || "-",
        },
        {
            title: "Price",
            dataIndex: "price",
            sorter: (a, b) => parseFloat(a.price) - parseFloat(b.price),
            render: (price, record) => (
                <span style={{ fontWeight: 500 }}>
                    {price ? `${price} ${record.currency}` : "-"}
                </span>
            ),
        },
    ];

    // Configure row selection
    const rowSelection = {
        selectedRowKeys,
        onChange: handleSelectionChange,
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE,
        ],
    };

    // Configure row click handler
    const onRow = (record) => ({
        onClick: () => {
            const selectedKeyIndex = selectedRowKeys.indexOf(record.id);
            const newSelectedKeys = [...selectedRowKeys];

            if (selectedKeyIndex >= 0) {
                // If already selected, remove it
                newSelectedKeys.splice(selectedKeyIndex, 1);
            } else {
                // If not selected, add it
                newSelectedKeys.push(record.id);
            }

            // Update selection
            handleSelectionChange(
                newSelectedKeys,
                skus.filter((sku) => newSelectedKeys.includes(sku.id))
            );
        },
    });

    return (
        <Table
            columns={columns}
            dataSource={skus}
            rowKey="id"
            pagination={false}
            loading={loading}
            size={size}
            scroll={{ y: 240 }}
            rowSelection={selectable ? rowSelection : undefined}
            onRow={selectable ? onRow : undefined}
        />
    );
}

export default OfferSkusTable;
