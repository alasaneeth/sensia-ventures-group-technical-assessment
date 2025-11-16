import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Select } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchOrders, updateOrderStatus, deleteOrder } from '../../store/slices/orderSlice';
import OrderForm from './OrderForm';

const { Option } = Select;

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, loading, pagination } = useSelector((state) => state.orders);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  const statusColors = {
    pending: 'orange',
    confirmed: 'blue',
    shipped: 'purple',
    delivered: 'green',
    cancelled: 'red',
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `AED ${parseFloat(amount).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) => handleStatusChange(record.id, value)}
          style={{ width: 120 }}
        >
          <Option value="pending">Pending</Option>
          <Option value="confirmed">Confirmed</Option>
          <Option value="shipped">Shipped</Option>
          <Option value="delivered">Delivered</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => setViewingOrder(record)}
          >
            View
          </Button>
          
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this order?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await dispatch(deleteOrder(id)).unwrap();
          toast.success('Order deleted successfully');
          dispatch(fetchOrders());
        } catch (error) {
          toast.error('Failed to delete order');
        }
      },
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingOrder(null);
  };

  const handleTableChange = (pagination) => {
    dispatch(fetchOrders({ 
      page: pagination.current, 
      limit: pagination.pageSize 
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <Button 
          type="primary" 
          onClick={() => setIsModalVisible(true)}
        >
          Create Order
        </Button>
      </div>

      <Table 
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />

      {/* Create/Edit Order Modal */}
      <Modal
        title={editingOrder ? 'Edit Order' : 'Create Order'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <OrderForm 
          order={editingOrder}
          onCancel={handleModalCancel}
          onSuccess={() => {
            setIsModalVisible(false);
            setEditingOrder(null);
            dispatch(fetchOrders());
          }}
        />
      </Modal>

      {/* View Order Modal */}
      <Modal
        title="Order Details"
        open={!!viewingOrder}
        onCancel={() => setViewingOrder(null)}
        footer={null}
        width={700}
      >
        {viewingOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Order ID:</strong> {viewingOrder.id}
              </div>
              <div>
                <strong>Client:</strong> {viewingOrder.client_name}
              </div>
              <div>
                <strong>Total Amount:</strong> AED {parseFloat(viewingOrder.total_amount).toFixed(2)}
              </div>
              <div>
                <strong>Status:</strong> 
                <Tag color={statusColors[viewingOrder.status]} className="ml-2">
                  {viewingOrder.status}
                </Tag>
              </div>
              <div>
                <strong>Created By:</strong> {viewingOrder.created_by_name}
              </div>
              <div>
                <strong>Created At:</strong> {new Date(viewingOrder.created_at).toLocaleString()}
              </div>
            </div>

            <div>
              <strong>Items:</strong>
              <Table 
                dataSource={viewingOrder.items}
                rowKey="id"
                pagination={false}
                className="mt-2"
              >
                <Table.Column title="Product" dataIndex="product_name" key="product_name" />
                <Table.Column title="Quantity" dataIndex="quantity" key="quantity" />
                <Table.Column title="Price" dataIndex="price" key="price" render={(price) => `AED ${parseFloat(price).toFixed(2)}`} />
                <Table.Column title="Subtotal" key="subtotal" render={(_, record) => `AED ${(record.quantity * record.price).toFixed(2)}`} />
              </Table>
            </div>

            <div>
              <strong>Payments:</strong>
              <Table 
                dataSource={viewingOrder.payments}
                rowKey="id"
                pagination={false}
                className="mt-2"
              >
                <Table.Column title="Method" dataIndex="method" key="method" />
                <Table.Column title="Amount" dataIndex="amount" key="amount" render={(amount) => `AED ${parseFloat(amount).toFixed(2)}`} />
                <Table.Column title="Date" dataIndex="created_at" key="created_at" render={(date) => new Date(date).toLocaleString()} />
              </Table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;