import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown } from 'antd'
import { 
  DashboardOutlined, 
  TeamOutlined, 
  ShoppingOutlined, 
  FileTextOutlined, 
  CommentOutlined, 
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined 
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../../store/slices/authSlice'

const { Sider } = Layout

const Sidebar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/clients',
      icon: <TeamOutlined />,
      label: 'Clients',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: 'Orders',
    },
    {
      key: '/comments',
      icon: <CommentOutlined />,
      label: 'Comments',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => {
        dispatch(logout())
        navigate('/login')
      },
    },
  ]

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed}
      className="bg-white shadow-lg"
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'white',
      }}
    >
      {/* Header Section */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-xl font-bold text-blue-600 bg-white">Admin Panel</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded bg-white"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>
      </div>

      {/* User Info Section */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3 bg-white">
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              className="bg-blue-500"
            />
            <div className="flex-1 min-w-0 bg-white">
              <p className="text-sm font-medium text-gray-900 truncate bg-white">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate bg-white">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {collapsed && (
        <div className="p-4 border-b border-gray-200 flex justify-center bg-white">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              className="bg-blue-500 cursor-pointer"
            />
          </Dropdown>
        </div>
      )}

      {/* Navigation Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        className="border-0 mt-2 bg-white"
        style={{ backgroundColor: 'white' }}
      />

      {/* User Menu (visible when not collapsed) */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4 bg-white">
          <Dropdown menu={{ items: userMenuItems }} placement="topRight">
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer bg-white">
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                className="bg-blue-500"
              />
              <div className="flex-1 min-w-0 bg-white">
                <p className="text-sm font-medium text-gray-900 truncate bg-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 truncate bg-white">
                  {user?.roles?.join(', ')}
                </p>
              </div>
              <LogoutOutlined className="text-gray-400 bg-white" />
            </div>
          </Dropdown>
        </div>
      )}
    </Sider>
  )
}

export default Sidebar