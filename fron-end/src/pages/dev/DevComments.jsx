import React, { useState, useEffect } from 'react';
import { Typography, Empty, Pagination, Spin, Alert, Card } from 'antd';
import { getComments } from '../../api/dev';
import DevComment from '../../components/dev/DevComment';
import CommentForm from '../../components/dev/CommentForm';

const { Title, Paragraph } = Typography;

function DevComments() {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0
    });

    const fetchComments = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const result = await getComments(page, pageSize);
            
            if (typeof result === 'string') {
                setError(result);
                return;
            }
            
            setComments(result.data || []);
            setPagination({
                current: page,
                pageSize: pageSize,
                total: result.pagination?.total || 0
            });
            setError(null);
        } catch (err) {
            console.error('Failed to fetch comments:', err);
            setError('Failed to load comments. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const handlePageChange = (page, pageSize) => {
        fetchComments(page, pageSize);
    };

    const handleCommentAdded = (newComment) => {
        // Add the new comment to the top of the list
        setComments(prevComments => [newComment, ...prevComments]);
        
        // Update total count in pagination
        setPagination(prev => ({
            ...prev,
            total: prev.total + 1
        }));
    };

    const handleCommentUpdated = (updatedComment) => {
        
        // Update the comment in the list
        setComments(prevComments => 
            prevComments.map(comment => 
                comment.id === updatedComment.id ? updatedComment : comment
            )
        );
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
            <Card style={{ marginBottom: 24, textAlign: 'center' }}>
                <Title level={2}>Something on your mind?</Title>
                <Paragraph>
                    Found a bug? Have a feature request? Let us know and we'll work on it!
                </Paragraph>
            </Card>

            <CommentForm onCommentAdded={handleCommentAdded} />

            {loading && comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                </div>
            ) : error ? (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                />
            ) : comments.length === 0 ? (
                <Empty 
                    description="No comments yet. Be the first to add one!" 
                    style={{ margin: '40px 0' }}
                />
            ) : (
                <>
                    <div style={{ marginBottom: 16 }}>
                        {comments.map(comment => (
                            <DevComment 
                                key={comment.id} 
                                comment={comment} 
                                onCommentUpdated={handleCommentUpdated}
                            />
                        ))}
                    </div>
                    
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default DevComments;
