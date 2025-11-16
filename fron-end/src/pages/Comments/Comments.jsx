import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchComments, createComment, updateComment, deleteComment } from '../../store/slices/commentSlice';

const { TextArea } = Input;

const Comments = () => {
  const dispatch = useDispatch();
  const { comments, loading, pagination, error } = useSelector((state) => state.comments);
  const { user } = useSelector((state) => state.auth);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: 'User',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
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
  ];

  useEffect(() => {
    dispatch(fetchComments());
  }, [dispatch]);

  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleAdd = () => {
    setEditingComment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (comment) => {
    setEditingComment(comment);
    form.setFieldsValue({ content: comment.content });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this comment?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(deleteComment(id)).unwrap();
          toast.success('Comment deleted successfully!');
          dispatch(fetchComments()); // Refresh the list
        } catch (error) {
          toast.error('Failed to delete comment');
        }
      },
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingComment(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      if (editingComment) {
        await dispatch(updateComment({ 
          id: editingComment.id, 
          content: values.content 
        })).unwrap();
        toast.success('Comment updated successfully!');
      } else {
        await dispatch(createComment(values)).unwrap();
        toast.success('Comment created successfully!');
      }
      setIsModalVisible(false);
      setEditingComment(null);
      form.resetFields();
      dispatch(fetchComments()); // Refresh the list
    } catch (error) {
      toast.error(error || 'Failed to save comment');
    }
  };

  const handleTableChange = (pagination) => {
    dispatch(fetchComments({ 
      page: pagination.current, 
      limit: pagination.pageSize 
    }));
  };

  return (
    <div>
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Comments</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Comment
        </Button>
      </div>

      <Table 
        columns={columns}
        dataSource={comments}
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

      <Modal
        title={editingComment ? 'Edit Comment' : 'Add Comment'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Content"
            name="content"
            rules={[{ required: true, message: 'Please input comment content!' }]}
          >
            <TextArea 
              placeholder="Enter your comment" 
              rows={4}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="flex justify-end">
              <Button onClick={handleModalCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingComment ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Comments;