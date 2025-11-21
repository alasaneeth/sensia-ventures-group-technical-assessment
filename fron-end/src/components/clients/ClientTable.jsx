import { useState, useEffect } from "react";
import { Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import SearchFilterDropdown from "../campaigns/SearchFilterDropdown";
import { getClients, getFilteredClients } from "../../api/client";
import ClientActions from "./ClientActions";
import formatDate from "../../util/formatDate";
import insertAt from "../../util/insertAt";

/**
 * Client table component
 * @param {Object} props
 * @param {boolean} props.showActions - Whether to show the actions column
 * @param {boolean} props.selectable - Whether rows are selectable
 * @param {boolean} props.inModal - Whether the table is displayed in a modal
 * @param {Function} props.onSelectionChange - Function to call when selection changes
 * @param {Array} props.selectedClients - Array of currently selected clients
 * @param {Object} props.filters - Object with filters to apply (e.g. {country: 'USA'})
 * @param {boolean} props.filterEnrolled - Whether to filter out enrolled clients
 * @param {number} props.campaignId - Campaign ID for filtering enrolled clients
 */
function ClientTable({
    showActions = true,
    selectable = false,
    inModal = false,
    onSelectionChange = null,
    selectedClients = [],
    filters = {},
    filterEnrolled = false,
    campaignId = null,
}) {
    // Track selected row keys and selected clients
    const [selectedRowKeys, setSelectedRowKeys] = useState(
        selectedClients?.length > 0
            ? selectedClients.map((client) => client.id)
            : []
    );
    const [selectedClientMap, setSelectedClientMap] = useState(() => {
        if (selectedClients?.length > 0) {
            return selectedClients.reduce(
                (map, client) => ({ ...map, [client.id]: client }),
                {}
            );
        }
        return {};
    });

    // Only use URL params if not in modal
    const [searchParams, setSearchParams] = useSearchParams();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: inModal ? 1 : 1,
        pageSize: inModal
            ? 10
            : 100,
        total: 0,
    });

    // Update selected rows when selectedClients changes (only in selectable mode)
    useEffect(() => {
        if (selectable && selectedClients && selectedClients.length > 0) {
            setSelectedRowKeys(selectedClients.map((client) => client.id));
            setSelectedClientMap(
                selectedClients.reduce(
                    (map, client) => ({ ...map, [client.id]: client }),
                    {}
                )
            );
        } else if (
            selectable &&
            selectedClients &&
            selectedClients.length === 0
        ) {
            setSelectedRowKeys([]);
            setSelectedClientMap({});
        }
    }, [selectedClients, selectable]);

    // Table columns definition
    const baseColumns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            fixed: "left",
        },
        {
            title: "First Name",
            dataIndex: "firstName",
            key: "firstName",
            width: 150,
            ellipsis: true,
            render: (firstName) => firstName || "-",
            filterDropdown: (props) => (
                <SearchFilterDropdown
                    {...props}
                    placeholder="Search first name"
                />
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{ color: filtered ? "#1890ff" : undefined }}
                />
            ),
            onFilter: (value, record) => {
                return record.firstName
                    ?.toLowerCase()
                    .includes(value.toLowerCase());
            },
        },
        {
            title: "Last Name",
            dataIndex: "lastName",
            key: "lastName",
            width: 150,
            ellipsis: true,
            render: (lastName) => lastName || "-",
            filterDropdown: (props) => (
                <SearchFilterDropdown
                    {...props}
                    placeholder="Search last name"
                />
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{ color: filtered ? "#1890ff" : undefined }}
                />
            ),
            onFilter: (value, record) => {
                return record.lastName
                    ?.toLowerCase()
                    .includes(value.toLowerCase());
            },
        },
        {
            title: "Additional Name",
            dataIndex: "additionalName",
            key: "additionalName",
            width: 150,
            ellipsis: true,
            render: (additionalName) => additionalName || "-",
        },
        // {
        //     title: "Mail",
        //     dataIndex: "email",
        //     key: "email",
        //     width: 200,
        //     ellipsis: true,
        //     render: (email) => email || "-",
        // },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
            width: 150,
            ellipsis: true,
            render: (phone) => phone || "-",
        },
        {
            title: "State",
            dataIndex: "state",
            key: "state",
            width: 200,
            ellipsis: true,
            render: (state) => state || "-",
        },
        {
            title: "City",
            dataIndex: "city",
            key: "city",
            width: 150,
            render: (city) => city || "-",
            filterDropdown: (props) => (
                <SearchFilterDropdown {...props} placeholder="Search city" />
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{ color: filtered ? "#1890ff" : undefined }}
                />
            ),
            onFilter: (value, record) => {
                return record.city?.toLowerCase().includes(value.toLowerCase());
            },
        },
        {
            title: "ZIP/Postal Code",
            dataIndex: "zipCode",
            key: "zipCode",
            width: 120,
            render: (zipCode) => zipCode || "-",
        },
        {
            title: "Country",
            dataIndex: "country",
            key: "country",
            width: 150,
            render: (country) => country || "-",
            filterDropdown: (props) => (
                <SearchFilterDropdown {...props} placeholder="Search country" />
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{ color: filtered ? "#1890ff" : undefined }}
                />
            ),
            onFilter: (value, record) => {
                return record.country
                    ?.toLowerCase()
                    .includes(value.toLowerCase());
            },
        },
        {
            title: "Address Line 1",
            dataIndex: "address1",
            key: "address1",
            ellipsis: true,
            render: (address) => address || "-",
        },
        {
            title: "Address Line 2",
            dataIndex: "address2",
            key: "address2",
            ellipsis: true,
            render: (address) => address || "-",
        },
        {
            title: "Address Line 3",
            dataIndex: "address3",
            key: "address3",
            ellipsis: true,
            render: (address) => address || "-",
        },
        // {
        //     title: "Address Line 4",
        //     dataIndex: "address4",
        //     key: "address4",
        //     ellipsis: true,
        //     render: (address) => address || "-",
        // },
        // {
        //     title: "Address Line 5",
        //     dataIndex: "address5",
        //     key: "address5",
        //     ellipsis: true,
        //     render: (address) => address || "-",
        // },
        {
            title: "Birth Date",
            dataIndex: "birthDate",
            key: "birthDate",
            width: 120,
            render: (date) => (date ? formatDate(date) : "-"),
        },
        {
            title: "Blacklisted",
            dataIndex: "isBlacklisted",
            key: "isBlacklisted",
            width: 100,
            render: (blacklisted) => (blacklisted ? "Yes" : "No"),
        },
    ];

    // Conditionaly render this
    if (!inModal) {
        insertAt(
            baseColumns,
            3,
            {
                title: "Last Purchase Date",
                dataIndex: "lastPurchaseDate",
                key: "lastPurchaseDate",
                width: 220,
                render: (date) => (date ? formatDate(date) : "-"),
            },
            {
                title: "Total Amount",
                dataIndex: "totalAmount",
                key: "totalAmount",
                width: 220,
                render: (amount) => (amount ? amount : "-"),
            },
            {
                title: "Total Orders",
                dataIndex: "totalOrders",
                key: "totalOrders",
                width: 220,
            },
            {
                title: "Total Mails",
                dataIndex: "totalMails",
                key: "totalMails",
                width: 220,
            }
        );

        baseColumns.push(
            {
                title: "Imported From",
                dataIndex: "importedFrom",
                key: "importedFrom",
                width: 200,
                render: (importedFrom) => importedFrom || "-",
            },
            {
                title: "Actions",
                key: "actions",
                fixed: "right",
                width: 85,
                render: (_, record) => <ClientActions record={record} />,
            }
        );
    }
    // Add actions column if showActions is true
    const columns = showActions ? baseColumns : baseColumns.slice(0, -1);

    // Fetch clients data
    useEffect(() => {
        async function loadClients() {
            setLoading(true);
            try {
                let result;

                if (filterEnrolled && campaignId) {
                    // Use filtered clients API when filterEnrolled is true and campaignId is provided
                    result = await getFilteredClients(
                        pagination.current,
                        pagination.pageSize,
                        campaignId,
                        filters
                    );
                } else {
                    // Use regular clients API
                    result = await getClients(
                        pagination.current,
                        pagination.pageSize,
                        filters
                    );
                }

                setClients(result.data);

                setPagination((prev) => ({
                    ...prev,
                    total: result.pagination?.total || 0,
                    current: result.pagination?.page || prev.current,
                    pageSize: result.pagination?.limit || prev.pageSize,
                }));
            } catch (error) {
                console.error("Error fetching clients:", error);
            } finally {
                setLoading(false);
            }
        }

        loadClients();
    }, [
        pagination.current,
        pagination.pageSize,
        JSON.stringify(filters),
        filterEnrolled,
        campaignId,
    ]);

    // Update URL when pagination changes (only if not in modal)
    useEffect(() => {
        if (!inModal) {
            setSearchParams({
                page: pagination.current.toString(),
                rows_per_page: pagination.pageSize.toString(),
            });
        }
    }, [pagination.current, pagination.pageSize, setSearchParams, inModal]);

    // Handle table change (pagination, filters, sorter)
    function handleTableChange(paginationParams, filters, sorter) {
        setPagination((prev) => ({
            ...prev,
            current: paginationParams.current,
            pageSize: paginationParams.pageSize,
        }));
    }

    // Configure row selection if needed
    let rowSelection;
    if (selectable) {
        rowSelection = {
            type: "checkbox",
            preserveSelectedRowKeys: true, // Keep selections when changing pages
            selectedRowKeys: selectedRowKeys,
            columnWidth: 40,
            fixed: true, // Fix the selection column to the left
            onChange: (selectedRowKeys, selectedRows) => {
                setSelectedRowKeys(selectedRowKeys);

                // Get all currently selected clients (including from other pages)
                const currentClientIds = clients.map((client) => client.id);

                // Find clients that are currently visible and selected
                const visibleSelectedClients = clients.filter((client) =>
                    selectedRowKeys.includes(client.id)
                );

                // Find previously selected clients that are not on the current page
                const previouslySelectedClients = Object.values(
                    selectedClientMap
                ).filter(
                    (client) =>
                        !currentClientIds.includes(client.id) &&
                        selectedRowKeys.includes(client.id)
                );

                // Combine visible selected clients with previously selected clients
                const allSelectedClients = [
                    ...visibleSelectedClients,
                    ...previouslySelectedClients,
                ];

                if (onSelectionChange) {
                    onSelectionChange(allSelectedClients);
                }
            },
        };
    } else {
        rowSelection = undefined;
    }

    // Configure row click handler if needed
    function onRow(record) {
        return {
            onClick: () => {
                if (selectable) {
                    // Toggle selection on click
                    const recordId = record.id;
                    let newSelectedKeys;

                    if (selectedRowKeys.includes(recordId)) {
                        // Remove if already selected
                        newSelectedKeys = selectedRowKeys.filter(
                            (key) => key !== recordId
                        );
                    } else {
                        // Add if not selected
                        newSelectedKeys = [...selectedRowKeys, recordId];
                    }

                    setSelectedRowKeys(newSelectedKeys);

                    if (onSelectionChange) {
                        // Get all currently selected clients (including from other pages)
                        const currentClientIds = clients.map(
                            (client) => client.id
                        );

                        // Find clients that are currently visible and selected
                        const visibleSelectedClients = clients.filter(
                            (client) => newSelectedKeys.includes(client.id)
                        );

                        // Find previously selected clients that are not on the current page
                        const previouslySelectedClients =
                            selectedClients.filter(
                                (client) =>
                                    !currentClientIds.includes(client.id) &&
                                    newSelectedKeys.includes(client.id)
                            );

                        // Combine visible selected clients with previously selected clients
                        const allSelectedClients = [
                            ...visibleSelectedClients,
                            ...previouslySelectedClients,
                        ];

                        onSelectionChange(allSelectedClients);
                    }
                }
            },
        };
    }

    // Add custom styles to prevent column title truncation
    const tableStyle = {
        ".ant-table-thead > tr > th": {
            whiteSpace: "normal",
            wordBreak: "break-word",
            height: "auto",
        },
        ".ant-table-cell": {
            wordBreak: "break-word",
            whiteSpace: "normal",
        },
    };

    return (
        <>
            <style jsx="true">{`
                .ant-table-thead > tr > th {
                    white-space: normal !important;
                    word-break: break-word !important;
                    height: auto !important;
                }
                .ant-table-cell {
                    word-break: break-word !important;
                    white-space: normal !important;
                }
            `}</style>
            <Table
                columns={columns}
                dataSource={clients}
                rowKey="id"
                // Add a key that forces the table to reset when in modal mode
                key={inModal ? "modal-table" : "regular-table"}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["100", "150", "175", "200"],
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`,
                    position: ["bottomCenter"],
                }}
                scroll={{
                    x: "max-content", // Allow horizontal scrolling based on content
                    y: 600,
                }}
                loading={loading}
                onChange={handleTableChange}
                rowSelection={rowSelection}
                onRow={onRow}
                className="client-table-custom"
            />
        </>
    );
}

export default ClientTable;
