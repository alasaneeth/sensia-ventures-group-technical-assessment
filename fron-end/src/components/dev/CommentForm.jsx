import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { createComment } from '../../api/dev';
import { useSelector } from 'react-redux';

const { TextArea } = Input;

function CommentForm({ onCommentAdded }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    
    // Get current user from Redux store
    const currentUser = useSelector((state) => state.auth.user);
    
    const handleSubmit = async (values) => {
        if (!currentUser) {
            message.error('You must be logged in to add a comment');
            return;
        }
        
        setLoading(true);
        try {
            const result = await createComment({
                userId: currentUser.id,
                type: values.type,
                comment: values.comment
            });
            
            if (result.data) {
                message.success('Comment added successfully');
                form.resetFields();
                if (onCommentAdded) {
                    onCommentAdded(result.data);
                }
            } else {
                message.error('Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            message.error('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Card title="Add Your Feedback" style={{ marginBottom: 24 }}>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ type: 'bug' }}
            >
                <Form.Item
                    name="type"
                    label="Type"
                    rules={[{ required: true, message: 'Please select a type' }]}
                >
                    <Select
                        options={[
                            { value: 'bug', label: 'Bug Report' },
                            { value: 'feature', label: 'Feature Request' }
                        ]}
                    />
                </Form.Item>
                
                <Form.Item
                    name="comment"
                    label="Your Comment"
                    rules={[{ required: true, message: 'Please enter your comment' }]}
                >
                    <TextArea
                        placeholder="Describe the bug or feature request..."
                        autoSize={{ minRows: 3, maxRows: 6 }}
                    />
                </Form.Item>
                
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={loading}
                    >
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default CommentForm;
