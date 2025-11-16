// src/pages/Clients/ClientForm.jsx
import React from 'react'
import { Form, Input, Button, Space } from 'antd'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { createClient, updateClient } from '../../store/slices/clientSlice'

const ClientForm = ({ client, onCancel, onSuccess }) => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (client) {
      form.setFieldsValue(client)
    }
  }, [client, form])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      if (client) {
        // Dispatch update action
        await dispatch(updateClient({ 
          id: client.id, 
          clientData: values 
        })).unwrap()
        toast.success('Client updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        })
      } else {
        // Dispatch create action
        await dispatch(createClient(values)).unwrap()
        toast.success('Client created successfully!', {
          position: "top-right",
          autoClose: 3000,
        })
      }
      onSuccess()
    } catch (error) {
      toast.error(error || 'Failed to save client!', {
        position: "top-right",
        autoClose: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please input client name!' }]}
      >
        <Input placeholder="Enter client name" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Please input client email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input placeholder="Enter email address" />
      </Form.Item>

      <Form.Item
        label="Phone"
        name="phone"
        rules={[{ required: true, message: 'Please input client phone!' }]}
      >
        <Input placeholder="Enter phone number" />
      </Form.Item>

      <Form.Item
        label="Address"
        name="address"
        rules={[{ required: true, message: 'Please input client address!' }]}
      >
        <Input.TextArea placeholder="Enter address" rows={3} />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className="flex justify-end">
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {client ? 'Update' : 'Create'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export default ClientForm