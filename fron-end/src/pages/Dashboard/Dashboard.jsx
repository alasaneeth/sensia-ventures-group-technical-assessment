// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect } from 'react'
import { Row, Col, Card, Statistic } from 'antd'
import { 
  TeamOutlined, 
  ShoppingOutlined, 
  FileTextOutlined, 
  CommentOutlined 
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser } from '../../store/slices/authSlice'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const isClient = user?.roles?.includes('admin')

  useEffect(() => {
    dispatch(getCurrentUser())
  }, [dispatch])

  const stats = [
    {
      title: 'Total Clients',
      value: 0,
      icon: <TeamOutlined />,
      color: '#3f8600',
    },
    {
      title: 'Total Products',
      value: 0,
      icon: <ShoppingOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Total Orders',
      value: 0,
      icon: <FileTextOutlined />,
      color: '#722ed1',
    },
    {
      title: 'Total Comments',
      value: 0,
      icon: <CommentOutlined />,
      color: '#fa8c16',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {isClient && (
         <Row gutter={16} className="mb-6">
        {stats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      )}
      
     
      <Row gutter={16}>
        <Col span={12}>
          <Card title="User Information" className="h-64">
            {user && (
              <div className="space-y-3">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Roles:</strong> {user.roles?.join(', ') || 'No roles assigned'}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Quick Actions" className="h-64">
            <div className="space-y-3">
              <p>Manage your application from here. Use the navigation menu to access different sections.</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>Add new clients and products</li>
                <li>Process orders and payments</li>
                <li>Manage user comments</li>
                <li>Configure user permissions</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}


export default Dashboard