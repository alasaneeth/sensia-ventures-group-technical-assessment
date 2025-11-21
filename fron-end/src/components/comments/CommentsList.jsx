import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Empty, Spin, message, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { getComments, createComment } from "../../api/comments";
import Comment from "./Comment";

const { TextArea } = Input;

/**
 * CommentsList component to display and add comments for a client
 *
 * @param {Object} props
 * @param {string} props.clientId - The client ID to fetch comments for
 */
function CommentsList({ clientId }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
        hasMore: true,
    });

    // Refs for scroll handling
    const commentsContainerRef = useRef(null);
    const isInitialLoad = useRef(true);
    const isLoadingMore = useRef(false);

    // Fetch comments when component mounts or clientId changes
    useEffect(() => {
        if (clientId) {
            setLoading(true);
            fetchComments(1);
        }
    }, [clientId]);

    // Scroll to bottom on initial load or when a new comment is added
    useEffect(() => {
        if (
            commentsContainerRef.current &&
            (isInitialLoad.current || !isLoadingMore.current)
        ) {
            scrollToBottom();
            if (isInitialLoad.current && comments.length > 0) {
                isInitialLoad.current = false;
            }
        }
    }, [comments]);

    // Function to fetch comments
    const fetchComments = async (page) => {
        if (!clientId) return;

        try {
            isLoadingMore.current = page > 1;
            const result = await getComments(
                clientId,
                page,
                pagination.pageSize
            );

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            const { data, pagination: paginationData } = result;

            // Update comments and pagination
            // Sort comments to ensure newest are at the bottom
            const sortedData = [...data].sort((a, b) => {
                return new Date(a.createdAt) - new Date(b.createdAt);
            });

            setComments((prevComments) => {
                if (page === 1) {
                    return sortedData;
                } else {
                    // When loading more (older comments), add them to the top
                    return [...sortedData, ...prevComments];
                }
            });

            setPagination({
                current: paginationData.page,
                pageSize: paginationData.limit,
                total: paginationData.total,
                hasMore: paginationData.page < paginationData.pages,
            });
        } catch (error) {
            console.error("Error fetching comments:", error);
            message.error("Failed to load comments");
        } finally {
            setLoading(false);
            isLoadingMore.current = false;
        }
    };

    // Function to handle scroll to load more comments
    const handleScroll = () => {
        if (!commentsContainerRef.current) return;

        const { scrollTop } = commentsContainerRef.current;

        // If scrolled to top and has more comments, load more
        if (
            scrollTop === 0 &&
            pagination.hasMore &&
            !loading &&
            !isLoadingMore.current
        ) {
            const nextPage = pagination.current + 1;
            setLoading(true);
            fetchComments(nextPage);
        }
    };

    // Function to submit a new comment
    const handleSubmitComment = async () => {
        if (!newComment.trim() || !clientId) return;

        setSubmitting(true);
        try {
            const result = await createComment(clientId, {
                comment: newComment,
            });

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            // Add new comment to the list (at the bottom)
            setComments((prevComments) => [...prevComments, result.data]);
            setNewComment("");
            message.success("Comment added successfully");

            // Ensure we scroll to the bottom to see the new comment
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        } catch (error) {
            console.error("Error adding comment:", error);
            message.error("Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    };

    // Function to scroll to bottom of comments
    const scrollToBottom = () => {
        if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop =
                commentsContainerRef.current.scrollHeight;
        }
    };

    return (
        <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
            {/* Comments container */}
            <div
                ref={commentsContainerRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "10px",
                    marginBottom: "10px",
                    maxHeight: "400px",
                }}
                onScroll={handleScroll}
            >
                {loading && pagination.current > 1 ? (
                    <div style={{ textAlign: "center", padding: "10px" }}>
                        <Spin size="small" />
                    </div>
                ) : pagination.current > 1 &&
                  !pagination.hasMore &&
                  comments.length > 0 ? (
                    <div style={{ textAlign: "center", padding: "10px" }}>
                        <Typography.Text type="secondary">
                            No more comments
                        </Typography.Text>
                    </div>
                ) : null}

                {comments.length === 0 && !loading ? (
                    <Empty description="No comments yet" />
                ) : (
                    comments.map((comment) => (
                        <Comment key={comment.id} comment={comment} />
                    ))
                )}

                {loading && pagination.current === 1 && (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <Spin size="default" />
                    </div>
                )}
            </div>

            {/* Add comment form */}
            <div
                style={{
                    display: "flex",
                    marginTop: "10px",
                    position: "sticky",
                    bottom: "1px",
                    backgroundColor: "white",
                    alignItems: "center"
                }}
            >
                <TextArea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    style={{ marginRight: "10px", flex: 1 }}
                    disabled={submitting}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSubmitComment}
                    loading={submitting}
                    disabled={!newComment.trim()}
                >
                    Add
                </Button>
            </div>
        </div>
    );
}

export default CommentsList;
