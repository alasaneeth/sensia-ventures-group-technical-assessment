// src/pages/Users/UserForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Select, Checkbox, Row, Col, message } from 'antd';
import { useDispatch } from 'react-redux';
import { updateUserRoles, updateUserPermissions } from '../../store/slices/userSlice';

const { Option } = Select;

const UserForm = ({ user, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const availableRoles = ['admin', 'manager', 'user', 'viewer'];
  const availableFeatures = ['clients', 'products', 'orders', 'comments', 'users'];

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles || []);
      setPermissions(user.permissions || []);
    }
  }, [user]);

  const handleRoleChange = (roles) => {
    setSelectedRoles(roles);
  };

  const handlePermissionChange = (feature, action, checked) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.feature === feature);
      if (existing) {
        return prev.map(p => 
          p.feature === feature ? { ...p, [action]: checked } : p
        );
      } else {
        return [...prev, { 
          feature, 
          can_view: action === 'can_view' ? checked : false,
          can_create: action === 'can_create' ? checked : false,
          can_update: action === 'can_update' ? checked : false,
          can_delete: action === 'can_delete' ? checked : false,
        }];
      }
    });
  };

  const onFinish = async () => {
    setLoading(true);
    try {
      if (selectedRoles.length > 0) {
        await dispatch(updateUserRoles({ id: user.id, roles: selectedRoles })).unwrap();
      }
      
      if (permissions.length > 0) {
        await dispatch(updateUserPermissions({ id: user.id, permissions })).unwrap();
      }
      
      message.success('User updated successfully');
      onSuccess();
    } catch (error) {
      message.error(error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionValue = (feature, action) => {
    const permission = permissions.find(p => p.feature === feature);
    return permission ? permission[action] : false;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Username"
      >
        <Input value={user?.username} disabled />
      </Form.Item>

      <Form.Item
        label="Email"
      >
        <Input value={user?.email} disabled />
      </Form.Item>

      <Form.Item
        label="Roles"
        name="roles"
      >
        <Select
          mode="multiple"
          placeholder="Select roles"
          value={selectedRoles}
          onChange={handleRoleChange}
        >
          {availableRoles.map(role => (
            <Option key={role} value={role}>
              {role}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Permissions">
        <div className="border rounded p-4">
          <Row gutter={[16, 16]}>
            {availableFeatures.map(feature => (
              <Col span={24} key={feature}>
                <div className="mb-2">
                  <strong className="capitalize">{feature}</strong>
                </div>
                <Space>
                  <Checkbox
                    checked={getPermissionValue(feature, 'can_view')}
                    onChange={(e) => handlePermissionChange(feature, 'can_view', e.target.checked)}
                  >
                    View
                  </Checkbox>
                  <Checkbox
                    checked={getPermissionValue(feature, 'can_create')}
                    onChange={(e) => handlePermissionChange(feature, 'can_create', e.target.checked)}
                  >
                    Create
                  </Checkbox>
                  <Checkbox
                    checked={getPermissionValue(feature, 'can_update')}
                    onChange={(e) => handlePermissionChange(feature, 'can_update', e.target.checked)}
                  >
                    Update
                  </Checkbox>
                  <Checkbox
                    checked={getPermissionValue(feature, 'can_delete')}
                    onChange={(e) => handlePermissionChange(feature, 'can_delete', e.target.checked)}
                  >
                    Delete
                  </Checkbox>
                </Space>
              </Col>
            ))}
          </Row>
        </div>
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className="flex justify-end">
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default UserForm;