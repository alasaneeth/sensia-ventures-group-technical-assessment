import { Table, Typography } from "antd";
import { useState } from "react";
import { prepareChainsForTableView } from "../../util/chainUtil";

const { Text } = Typography;

/**
 * ChainTableView - Displays chain data in a table format with dependency and offer columns
 * @param {Object} props
 * @param {Object} props.chainData - Chain data from API
 * @param {boolean} props.selectable - Whether rows are selectable
 * @param {Function} props.onOfferSelect - Function to call when an offer is selected
 */
function ChainTableView({
    chainData,
    selectable = false,
    onOfferSelect,
    viewDependency = true,
    mails = false,
    viewActivation = false,
}) {
    console.log("Do you think I;m here ?");
    const [selectedRowKey, setSelectedRowKey] = useState(null);
    const tableData = prepareChainsForTableView(chainData);
    console.log("chain data: ", tableData);

    // Define table columns - only dependency offer and offer
    const columns = [
        // {
        //     title: "Dependency Offer",
        //     dataIndex: "dependencyOffer",
        //     key: "dependencyOffer",
        // },
        // {
        //     title: "Days after order",
        //     dataIndex: "daysToAdd",
        //     key: "daysToAdd",
        //     render: (text) => (
        //         <Text strong>
        //             {text ? `${text} day${+text > 1 ? "s" : ""}` : "-"}
        //         </Text>
        //     ),
        // },
        {
            title: "Offer",
            dataIndex: "offer",
            key: "offer",
            render: (text) => <Text strong>{text}</Text>,
        },
        // {
        //     title: "Return Address",
        //     dataIndex: "returnAddress",
        //     key: "returnAddress",
        // },
    ];

    if (viewActivation) {
        columns.unshift(
            {
                title: "Dependency Offer",
                dataIndex: "dependencyOffer",
                key: "dependencyOffer",
            },
            {
                title: "Activation",
                dataIndex: "daysToAdd",
                key: "activation",
            }
        );
    } else if (viewDependency) {
        columns.unshift({
            title: "Dependency Offer",
            dataIndex: "dependencyOffer",
            key: "dependencyOffer",
        });
    }

    if (mails) {
        columns.push({
            title: "Mails Quantity",
            key: "mailQuantity",
            dataIndex: "mailQuantity",
        });
    }

    // Configure row selection if needed
    let rowSelection;
    if (selectable) {
        rowSelection = {
            type: "radio",
            selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
            onChange: (selectedRowKeys, selectedRows) => {
                if (selectedRows.length > 0) {
                    // Use the key property if available, otherwise fallback to the index
                    const rowKey = selectedRows[0].key || selectedRowKeys[0];
                    setSelectedRowKey(rowKey);
                    if (onOfferSelect) {
                        const selectedNode = chainData.chainNodes.find(
                            (node) => node.title === selectedRows[0].offer
                        );
                        if (selectedNode) {
                            onOfferSelect({
                                ...selectedRows[0],
                                id: selectedNode.id,
                            });
                        } else {
                            onOfferSelect(selectedRows[0]);
                        }
                    }
                } else {
                    setSelectedRowKey(null);
                }
            },
        };
    } else {
        rowSelection = undefined;
    }

    // Configure row click handler if needed
    function onRow(record, index) {
        if (selectable) {
            return {
                onClick: () => {
                    console.log("record: ", record);
                    // Use the key property if available, otherwise fallback to the index
                    const rowKey = record.key || index;
                    const selectedNode = chainData.chainNodes.find(
                        (node) => node.title === record.offer
                    );
                    console.log("got selecetd: ", record);
                    setSelectedRowKey(selectedNode);
                    if (onOfferSelect) {
                        onOfferSelect(selectedNode);
                    }
                },
            };
        } else {
            return {};
        }
    }

    if (chainData === undefined || chainData === null) {
        console.log("whats up bro");
        return null;
    }

    return (
        <div className="chain-table-view">
            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                bordered
                size="middle"
                rowSelection={rowSelection}
                onRow={onRow}
            />
        </div>
    );
}

export default ChainTableView;
