import React from 'react'
import { Form, Input, InputNumber, Button, Space, message } from 'antd'
import { useDispatch } from 'react-redux'
import { createProduct, updateProduct } from '../../store/slices/productSlice'

const ProductForm = ({ product, onCancel, onSuccess }) => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()

  React.useEffect(() => {
    if (product) {
      form.setFieldsValue(product)
    } else {
      form.resetFields()
    }
  }, [product, form])

  const onFinish = async (values) => {
    try {
      if (product) {
        // Update existing product
        await dispatch(updateProduct({ id: product.id, productData: values })).unwrap()
      } else {
        // Create new product
        await dispatch(createProduct(values)).unwrap()
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving product:', error)
      message.error('Failed to save product. Please try again.')
    }
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
      initialValues={{
        name: '',
        description: '',
        price: 0,
        stock: 0
      }}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please input product name!' }]}
      >
        <Input placeholder="Enter product name" />
      </Form.Item>

      <Form.Item
        label="Description"
        name="description"
      >
        <Input.TextArea placeholder="Enter product description" rows={3} />
      </Form.Item>

      <Form.Item
        label="Price"
        name="price"
        rules={[{ required: true, message: 'Please input product price!' }]}
      >
        <InputNumber
          placeholder="Enter price"
          min={0}
          step={0.01}
          className="w-full"
          formatter={value => `AED ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\AED\s?|(,*)/g, '')}
        />
      </Form.Item>

      <Form.Item
        label="Stock"
        name="stock"
        rules={[{ required: true, message: 'Please input stock quantity!' }]}
      >
        <InputNumber
          placeholder="Enter stock quantity"
          min={0}
          className="w-full"
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className="flex justify-end">
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            {product ? 'Update' : 'Create'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export default ProductForm