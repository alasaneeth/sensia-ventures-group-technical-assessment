import React, { useState } from 'react';
import { Card, Typography, Tag, Button, Input, Space, Tooltip, Select } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { updateComment } from '../../api/dev';
import { useSelector } from 'react-redux';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

function DevComment({ comment, onCommentUpdated }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedComment, setEditedComment] = useState(comment.comment);
    const [editedType, setEditedType] = useState(comment.type);
    const [loading, setLoading] = useState(false);
    
    // Get current user from Redux store
    const currentUser = useSelector((state) => state.auth.user);
    const isAuthor = currentUser && currentUser.id === comment.user.id;
    
    const handleEdit = () => {
        setIsEditing(true);
    };
    
    const handleCancel = () => {
        setIsEditing(false);
        setEditedComment(comment.comment);
        setEditedType(comment.type);
    };
    
    const handleSave = async () => {
        if (!editedComment.trim()) return;
        
        setLoading(true);
        try {
            const updatedData = await updateComment(comment.id, {
                comment: editedComment,
                type: editedType
            });
            
            setIsEditing(false);
            if (onCommentUpdated && updatedData) {
                onCommentUpdated(updatedData);
            }
        } catch (error) {
            console.error('Failed to update comment:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const getTypeColor = (type) => {
        return type === 'bug' ? 'error' : 'success';
    };
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };
    
    return (
        <Card 
            style={{ marginBottom: 16 }}
            size="small"
            title={
                <Space>
                    <Text strong>{comment.user.firstName} {comment.user.lastName}</Text>
                    <Text type="secondary">@{comment.user.username}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatDate(comment.createdAt)}
                    </Text>
                </Space>
            }
            extra={
                isAuthor && !isEditing ? (
                    <Tooltip title="Edit comment">
                        <Button 
                            icon={<EditOutlined />} 
                            type="text" 
                            size="small" 
                            onClick={handleEdit}
                        />
                    </Tooltip>
                ) : null
            }
        >
            {isEditing ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Select
                        value={editedType}
                        onChange={setEditedType}
                        style={{ width: 120 }}
                        options={[
                            { value: 'bug', label: 'Bug' },
                            { value: 'feature', label: 'Feature' }
                        ]}
                    />
                    <TextArea
                        value={editedComment}
                        onChange={(e) => setEditedComment(e.target.value)}
                        autoSize={{ minRows: 2, maxRows: 6 }}
                    />
                    <Space>
                        <Button 
                            type="primary" 
                            icon={<SaveOutlined />} 
                            onClick={handleSave}
                            loading={loading}
                        >
                            Save
                        </Button>
                        <Button 
                            icon={<CloseOutlined />} 
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </Space>
                </Space>
            ) : (
                <>
                    <Tag color={getTypeColor(comment.type)}>
                        {comment.type === 'bug' ? 'Bug' : 'Feature'}
                    </Tag>
                    <Paragraph style={{ marginTop: 8 }}>
                        {comment.comment}
                    </Paragraph>
                </>
            )}
        </Card>
    );
}

export default DevComment;
