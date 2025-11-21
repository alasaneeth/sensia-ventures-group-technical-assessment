import { useState, useEffect } from 'react';
import { Table, Typography, Empty } from 'antd';
import { fetchChains } from '../../api/offer';

const { Text } = Typography;

/**
 * OrderChainsTable - Displays chain data in a table format for order placement
 * @param {Object} props
 * @param {Function} props.onChainSelect - Function to call when a chain is selected
 * @param {boolean} props.loading - External loading state
 */
function OrderChainsTable({ onChainSelect, loading: externalLoading = false }) {
    // State variables
    const [chains, setChains] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRowKey, setSelectedRowKey] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0
    });

    // Fetch chains data
    useEffect(() => {
        async function loadChains() {
            setLoading(true);
            try {
                const result = await fetchChains(pagination.current, pagination.pageSize);
                setChains(result.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: result.pagination?.total || 0,
                    current: result.pagination?.page || prev.current,
                    pageSize: result.pagination?.limit || prev.pageSize
                }));
            } catch (error) {
                console.error('Error fetching chains:', error);
            } finally {
                setLoading(false);
            }
        }
        
        loadChains();
    }, [pagination.current, pagination.pageSize]);

    // Handle table pagination change
    function handleTableChange(paginationParams) {
        setPagination(prev => ({
            ...prev,
            current: paginationParams.current,
            pageSize: paginationParams.pageSize
        }));
    }

    // Table columns definition
    const columns = [
        {
            title: 'Chain ID',
            dataIndex: 'id',
            key: 'chainId',
            width: 100,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) => text || 'No description',
        },
    ];

    // Configure row selection
    const rowSelection = {
        type: 'radio',
        selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
        onChange: (selectedRowKeys, selectedRows) => {
            if (selectedRows.length > 0) {
                setSelectedRowKey(selectedRows[0].id);
                if (onChainSelect) {
                    onChainSelect(selectedRows[0]);
                }
            } else {
                setSelectedRowKey(null);
            }
        }
    };

    // Configure row click handler
    function onRow(record) {
        return {
            onClick: () => {
                setSelectedRowKey(record.id);
                if (onChainSelect) {
                    onChainSelect(record);
                }
            }
        };
    }

    // If no chains found, display a message
    if (chains.length === 0 && !loading) {
        return <Empty description="No chains available" />;
    }

    return (
        <Table 
            columns={columns}
            dataSource={chains}
            rowKey="id"
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ['100', '150', '175', '200'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} chains`,
                position: ['bottomCenter']
            }}
            loading={loading || externalLoading}
            onChange={handleTableChange}
            rowSelection={rowSelection}
            onRow={onRow}
            size="middle"
        />
    );
}

export default OrderChainsTable;
