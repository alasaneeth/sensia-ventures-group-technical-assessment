import { Table, Typography, Empty } from "antd";
import { useState, useEffect } from "react";
import SearchFilterDropdown from "../campaigns/SearchFilterDropdown";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

/**
 * ClientOrderTable - Displays client data in a table format for order placement
 * @param {Object} props
 * @param {Array} props.clients - Array of client objects from search results
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onClientSelect - Function to call when a client is selected
 * @param {Object} props.pagination - Pagination configuration
 * @param {Function} props.onPaginationChange - Function to call when pagination changes
 */
function ClientOrderTable({
    clients = [],
    loading = false,
    onClientSelect,
    pagination = { current: 1, pageSize: 100, total: 0 },
    onPaginationChange,
}) {
    // Track selected row key
    const [selectedRowKey, setSelectedRowKey] = useState(null);

    // Reset selection when clients change
    useEffect(() => {
        setSelectedRowKey(null);
    }, [clients]);

    // Define table columns
    // const columns = [
    //     {
    //         title: 'First Name',
    //         dataIndex: ['firstName'],
    //         key: 'firstName',
    //         render: (text) => <Text strong>{text}</Text>,
    //     },
    //     {
    //         title: 'Last Name',
    //         dataIndex: ['lastName'],
    //         key: 'lastName',
    //     },
    //     {
    //         title: 'Email',
    //         dataIndex: ['email'],
    //         key: 'email',
    //         ellipsis: true,
    //     },
    //     {
    //         title: 'Phone',
    //         dataIndex: ['phone'],
    //         key: 'phone',
    //         render: (phone) => phone || '-',
    //     },
    //     {
    //         title: 'Country',
    //         dataIndex: ['country'],
    //         key: 'country',
    //         render: (country) => country || '-',
    //     },
    // ];

    const columns = [
        {
            title: "Full Name",
            key: "fullName",
            fixed: "left",
            width: 180,
            sorter: (a, b) => {
                const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                return nameA.localeCompare(nameB);
            },
            filterDropdown: (props) => (
                <SearchFilterDropdown {...props} placeholder="Search name" />
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{ color: filtered ? "#1890ff" : undefined }}
                />
            ),
            onFilter: (value, record) => {
                const fullName =
                    `${record.firstName} ${record.lastName}`.toLowerCase();
                return fullName.includes(value.toLowerCase());
            },
            render: (record) => (
                <span>
                    {record.firstName} {record.lastName}
                </span>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 220,
            ellipsis: true,
            render: (email) => email || "-",
            filterDropdown: (props) => (
                <SearchFilterDropdown {...props} placeholder="Search email" />
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{ color: filtered ? "#1890ff" : undefined }}
                />
            ),
            onFilter: (value, record) =>
                record.email?.toLowerCase().includes(value.toLowerCase()) ||
                false,
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
            title: "ZIP Code 1",
            dataIndex: "zipCode",
            key: "zipCode",
            width: 120,
            render: (zip) => zip || "-",
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
            width: 150,
            render: (phone) => phone || "-",
            filterDropdown: (props) => (
                <SearchFilterDropdown {...props} placeholder="Search phone" />
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{ color: filtered ? "#1890ff" : undefined }}
                />
            ),
            onFilter: (value, record) =>
                record.phone?.toLowerCase().includes(value.toLowerCase()),
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
            onFilter: (value, record) =>
                record.country?.toLowerCase().includes(value.toLowerCase()),
        },
    ];

    // Configure row selection
    const rowSelection = {
        type: "radio",
        selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
        onChange: (selectedRowKeys, selectedRows) => {
            if (selectedRows.length > 0) {
                setSelectedRowKey(selectedRows[0].id);
                if (onClientSelect) {
                    onClientSelect(selectedRows[0]);
                }
            } else {
                setSelectedRowKey(null);
            }
        },
    };

    // Configure row click handler
    function onRow(record) {
        return {
            onClick: () => {
                setSelectedRowKey(record.id);
                if (onClientSelect) {
                    onClientSelect(record);
                }
            },
        };
    }

    // If no clients found, display a message
    if (clients.length === 0 && !loading) {
        return <Empty description="No clients found with that name" />;
    }

    // Handle pagination change
    function handleTableChange(paginationParams, filters, sorter, extra) {
        // Log the pagination change for debugging
        console.log('Table change:', { paginationParams, filters, sorter, extra });
        
        if (onPaginationChange) {
            // Make sure we're passing the complete pagination object with current, pageSize, etc.
            onPaginationChange({
                current: paginationParams.current,
                pageSize: paginationParams.pageSize,
                total: paginationParams.total
            });
        }
    }

    return (
        <Table
            style={{ width: "100%", overflow: "auto" }}
            columns={columns}
            dataSource={clients}
            rowKey="id"
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ["100", "150", "175", "200"],
                showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} clients`,
                position: ["bottomCenter"],
            }}
            loading={loading}
            // size="middle"
            rowSelection={rowSelection}
            onRow={onRow}
            scroll={{
                x: "max-content", // horizontal scroll from the beginning
                y: 400,           // (optional) fix table height with vertical scroll
            }}
            onChange={handleTableChange}
        />
    );
}

export default ClientOrderTable;
