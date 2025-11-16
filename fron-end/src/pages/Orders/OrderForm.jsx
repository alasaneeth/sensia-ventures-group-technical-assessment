import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Select, Table, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { createOrder, updateOrder } from '../../store/slices/orderSlice';
import { fetchClients } from '../../store/slices/clientSlice';
import { fetchProducts } from '../../store/slices/productSlice';

const { Option } = Select;

const OrderForm = ({ order, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { clients } = useSelector((state) => state.clients);
  const { products } = useSelector((state) => state.products);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (order) {
      form.setFieldsValue({
        client_id: order.client_id,
        status: order.status,
      });
      setItems(order.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.product_name,
      })));
      setPayments(order.payments);
    }
  }, [order, form]);

  const addItem = () => {
    setItems([...items, { product_id: null, quantity: 1, price: 0, product_name: '' }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        product_id: value,
        price: product ? product.price : 0,
        product_name: product ? product.name : '',
      };
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const addPayment = () => {
    setPayments([...payments, { method: 'cash', amount: 0 }]);
  };

  const removePayment = (index) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
  };

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const calculatePaid = () => {
    return payments.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0);
  };

  const onFinish = async (values) => {
    if (items.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    const totalAmount = calculateTotal();
    const totalPaid = calculatePaid();

    if (Math.abs(totalAmount - totalPaid) > 0.01) {
      toast.error('Total payments must equal order total amount');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        ...values,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        payments: payments.map(payment => ({
          method: payment.method,
          amount: parseFloat(payment.amount),
        })),
      };

      if (order) {
        await dispatch(updateOrder({ id: order.id, orderData })).unwrap();
        toast.success('Order updated successfully');
      } else {
        await dispatch(createOrder(orderData)).unwrap();
        toast.success('Order created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: 'product_id',
      key: 'product_id',
      render: (value, record, index) => (
        <Select
          value={value}
          onChange={(val) => updateItem(index, 'product_id', val)}
          placeholder="Select product"
          style={{ width: '100%' }}
        >
          {products.map(product => (
            <Option key={product.id} value={product.id}>
              {product.name} - AED {product.price}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value, record, index) => (
        <InputNumber
          value={value}
          onChange={(val) => updateItem(index, 'quantity', val)}
          min={1}
        />
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `AED${parseFloat(price).toFixed(2)}`,
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      render: (_, record) => `AED${(record.quantity * record.price).toFixed(2)}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record, index) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        >
          Remove
        </Button>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (value, record, index) => (
        <Select
          value={value}
          onChange={(val) => updatePayment(index, 'method', val)}
          style={{ width: '100%' }}
        >
          <Option value="cash">Cash</Option>
          <Option value="card">Card</Option>
          <Option value="transfer">Transfer</Option>
        </Select>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value, record, index) => (
       <InputNumber
          value={value}
          onChange={(val) => updatePayment(index, 'amount', val)}
          min={0}
          step={0.01}
          formatter={value => `AED ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/AED\s?|(,*)/g, '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record, index) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removePayment(index)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Client"
        name="client_id"
        rules={[{ required: true, message: 'Please select a client!' }]}
      >
        <Select placeholder="Select client">
          {clients.map(client => (
            <Option key={client.id} value={client.id}>
              {client.name} - {client.email}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Status"
        name="status"
      >
        <Select placeholder="Select status">
          <Option value="pending">Pending</Option>
          <Option value="confirmed">Confirmed</Option>
          <Option value="shipped">Shipped</Option>
          <Option value="delivered">Delivered</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
      </Form.Item>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <strong>Order Items</strong>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
            Add Item
          </Button>
        </div>
        <Table
          dataSource={items}
          columns={itemColumns}
          rowKey={(record, index) => index}
          pagination={false}
          footer={() => (
            <div className="text-right font-semibold">
              Total: AED {calculateTotal().toFixed(2)}
            </div>
          )}
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <strong>Payments</strong>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addPayment}>
            Add Payment
          </Button>
        </div>
        <Table
          dataSource={payments}
          columns={paymentColumns}
          rowKey={(record, index) => index}
          pagination={false}
          footer={() => (
            <div className="text-right font-semibold">
              Paid: AED {calculatePaid().toFixed(2)}
              {Math.abs(calculateTotal() - calculatePaid()) > 0.01 && (
                <div className="text-red-500 text-sm">
                  Balance: AED {(calculateTotal() - calculatePaid()).toFixed(2)}
                </div>
              )}
            </div>
          )}
        />
      </div>

      <Form.Item className="mb-0">
        <Space className="flex justify-end">
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {order ? 'Update' : 'Create'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default OrderForm;