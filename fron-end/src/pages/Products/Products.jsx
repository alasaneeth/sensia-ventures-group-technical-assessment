import React, { useEffect, useState } from 'react'
import { Table, Button, Space, Modal, Input, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import ProductForm from './ProductForm'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser } from '../../store/slices/authSlice'
import { 
  fetchProducts, 
  deleteProduct, 
  clearError 
} from '../../store/slices/productSlice'

const Products = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { products, loading, error, pagination } = useSelector((state) => state.products)

  const isAdmin = user?.roles?.includes('admin')

  useEffect(() => {
    dispatch(getCurrentUser())
    dispatch(fetchProducts())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchText, setSearchText] = useState('')

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `AED ${parseFloat(price).toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
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
    setEditingProduct(null)
    setIsModalVisible(true)
  }

  const handleEdit = (product) => {
    if(!isAdmin) {
      message.info("Only Admin can edit")
      return
    } 
    setEditingProduct(product)
    setIsModalVisible(true)
  }

  const handleDelete = (id) => {
    if(!isAdmin) {
      message.info("Only Admin can delete")
      return
    } 
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        dispatch(deleteProduct(id))
      },
    })
  }

  const handleSearch = (value) => {
    setSearchText(value)
    dispatch(fetchProducts({ search: value }))
  }

  const handleTableChange = (pagination) => {
    dispatch(fetchProducts({ 
      page: pagination.current, 
      limit: pagination.pageSize,
      search: searchText 
    }))
  }

  const handleSuccess = () => {
    setIsModalVisible(false)
    dispatch(fetchProducts({ 
      page: pagination.page, 
      limit: pagination.limit,
      search: searchText 
    }))
    message.success(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
  }

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <div className="flex space-x-2">
          <Input.Search
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            className="w-64"
          />

          {isAdmin && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Product
            </Button>
          )}
        </div>
      </div>

      <Table 
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <ProductForm 
          product={editingProduct}
          onCancel={() => setIsModalVisible(false)}
          onSuccess={handleSuccess}
        />
      </Modal>
    </div>
  )
}

export default Products