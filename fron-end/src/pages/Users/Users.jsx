
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Tag, Switch, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUserStatus } from '../../store/slices/userSlice';
import UserForm from './UserForm';

const Users = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => (
        <Space>
          {roles?.map(role => (
            <Tag key={role} color="blue">
              {role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
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
        </Space>
      ),
    },
  ];

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalVisible(true);
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      await dispatch(updateUserStatus({ id: userId, is_active: isActive })).unwrap();
      message.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      message.error('Failed to update user status');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
      </div>

      <Table 
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
      />

      <Modal
        title="Edit User"
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <UserForm 
          user={editingUser}
          onCancel={handleModalCancel}
          onSuccess={() => {
            setIsModalVisible(false);
            setEditingUser(null);
            dispatch(fetchUsers());
          }}
        />
      </Modal>
    </div>
  );
};

export default Users;