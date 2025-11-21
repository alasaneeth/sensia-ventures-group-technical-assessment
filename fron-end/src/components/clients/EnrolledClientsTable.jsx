import { Table, Button, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import EnrolledClientActions from "./EnrolledClientActions";

/**
 * Table component for displaying enrolled clients
 * This component receives data as props from parent
 */
function EnrolledClientsTable({
    enrolledClients,
    loading,
    pagination,
    onTableChange,
    onRefresh,
}) {
    // Define columns for the table
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            sorter: true,
            fixed: "left",
        },

        {
            title: "Company",
            dataIndex: ["brand", "company", "name"],
            key: "company",
            width: 150,
            render: (text) => text || "-",
        },
        {
            title: "Brand",
            dataIndex: ["brand", "name"],
            key: "brand",
            width: 150,
            render: (text) => text || "-",
        },
        {
            title: "Code",
            dataIndex: "code",
            key: "code",
            width: 250,
            ellipsis: false,
            render: (text) => (
                <div style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                    {text}
                </div>
            ),
        },
        {
            title: "Client",
            key: "clientName",
            width: 180,
            fixed: "left",
            render: (_, record) => {
                const firstName = record.client?.firstName || "";
                const lastName = record.client?.lastName || "";
                return `${firstName} ${lastName}`;
            },
            sorter: (a, b) => {
                const nameA = `${a.client?.firstName || ""} ${
                    a.client?.lastName || ""
                }`;
                const nameB = `${b.client?.firstName || ""} ${
                    b.client?.lastName || ""
                }`;
                return nameA.localeCompare(nameB);
            },
        },
        // {
        //     title: 'Email',
        //     dataIndex: ['client', 'email'],
        //     key: 'email',
        //     width: 220,
        //     ellipsis: true,
        // },
        // {
        //     title: 'Phone',
        //     dataIndex: ['client', 'phone'],
        //     key: 'phone',
        //     width: 120,
        //     ellipsis: true,
        // },
        // {
        //     title: 'Country',
        //     dataIndex: ['client', 'country'],
        //     key: 'country',
        //     width: 120,
        //     render: (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : '-',
        // },
        // {
        //     title: 'Zip Code',
        //     key: 'zipCode',
        //     width: 120,
        //     render: (_, record) => {
        //         const zipCode1 = record.client?.zipCode1 || '';
        //         const zipCode2 = record.client?.zipCode2 || '';
        //         return zipCode1 + (zipCode2 ? ` / ${zipCode2}` : '');
        //     },
        // },
        // {
        //     title: 'Address',
        //     key: 'address',
        //     width: 220,
        //     ellipsis: true,
        //     render: (_, record) => {
        //         const address1 = record.client?.address1 || '';
        //         const address2 = record.client?.address2 || '';
        //         return address1 + (address2 ? `, ${address2}` : '');
        //     },
        // },
        {
            title: "Campaign",
            dataIndex: ["campaign", "code"],
            key: "campaign",
            width: 180,
            render: (text) => text || "-",
        },
        {
            title: "Chain",
            dataIndex: ["chain", "title"],
            key: "chain",
            width: 180,
            render: (text) => text || "-",
        },
        {
            title: "Current Offer",
            dataIndex: ["currentSequence", "currentOffer", "title"],
            key: "currentOffer",
            width: 180,
            render: (text) => text || "-",
        },
        // {
        //     title: 'Available From',
        //     dataIndex: 'availableAt',
        //     key: 'availableAt',
        //     width: 180,
        //     render: (text) => text ? new Date(text).toLocaleString() : '-',
        //     sorter: (a, b) => {
        //         const dateA = a.availableAt ? new Date(a.availableAt).getTime() : 0;
        //         const dateB = b.availableAt ? new Date(b.availableAt).getTime() : 0;
        //         return dateA - dateB;
        //     },
        // },
        // {
        //     title: 'Status',
        //     key: 'status',
        //     width: 120,
        //     render: (_, record) => (
        //         <Tag color={record.isBlackList ? 'red' : 'green'}>
        //             {record.isBlackList ? 'Blacklisted' : 'Active'}
        //         </Tag>
        //     ),
        // },
        // {
        //     title: 'Actions',
        //     key: 'actions',
        //     fixed: 'right',
        //     width: 100,
        //     render: (_, record) => (
        //         <EnrolledClientActions
        //             record={record}
        //             onRefresh={onRefresh}
        //         />
        //     ),
        // },
    ];

    return (
        <div>
            <div className="mb-4 text-right">
                <Button
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    loading={loading}
                >
                    Refresh
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={enrolledClients}
                rowKey="id"
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["100", "150", "175", "200"],
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} enrolled clients`,
                }}
                scroll={{ x: 1200 }}
                loading={loading}
                onChange={onTableChange}
            />
        </div>
    );
}

export default EnrolledClientsTable;
