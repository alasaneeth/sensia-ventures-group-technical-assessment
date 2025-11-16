import React, { useEffect, useState } from 'react'
import { Table, Button, Space, Modal, Form, Input } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { fetchClients, deleteClient } from '../../store/slices/clientSlice'
import ClientForm from './ClientForm'

const Clients = () => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  
  // Get clients from Redux store
  const { clients, loading, pagination } = useSelector((state) => state.clients)

  useEffect(() => {
    // Fetch clients when component mounts
    dispatch(fetchClients({ page: 1, limit: 10 }))
  }, [dispatch])

  const handleTableChange = (pagination, filters, sorter) => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
    }
    dispatch(fetchClients(params))
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
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
  ]

  const handleAdd = () => {
    setEditingClient(null)
    setIsModalVisible(true)
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setIsModalVisible(true)
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this client?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        dispatch(deleteClient(id))
          .unwrap()
          .then(() => {
            toast.success('Client deleted successfully!', {
              position: "top-right",
              autoClose: 3000,
            })
            // Refresh the table
            dispatch(fetchClients({ 
              page: pagination.page, 
              limit: pagination.limit 
            }))
          })
          .catch((error) => {
            toast.error(error || 'Failed to delete client!', {
              position: "top-right",
              autoClose: 5000,
            })
          })
      },
    })
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setEditingClient(null)
    form.resetFields()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Client
        </Button>
      </div>

      <Table 
        columns={columns}
        dataSource={clients}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingClient ? 'Edit Client' : 'Add Client'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={600}
      >
        <ClientForm 
          client={editingClient}
          onCancel={handleModalCancel}
          onSuccess={() => {
            setIsModalVisible(false)
            setEditingClient(null)
            // Refresh the table after successful operation
            dispatch(fetchClients({ 
              page: pagination.page, 
              limit: pagination.limit 
            }))
          }}
        />
      </Modal>
    </div>
  )
}

export default Clients