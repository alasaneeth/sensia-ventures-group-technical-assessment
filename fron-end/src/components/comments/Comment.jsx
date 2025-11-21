import React from "react";
import { Typography, Card } from "antd";
import formatDate from "../../util/formatDate";

const { Text, Paragraph } = Typography;

/**
 * Comment component to display a single comment
 *
 * @param {Object} props
 * @param {Object} props.comment - The comment data
 */
function Comment({ comment }) {
    return (
        <Card
            size="small"
            style={{
                marginBottom: "10px",
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
        >
            <Paragraph style={{ margin: 0 }}>{comment.comment}</Paragraph>
            <div style={{ textAlign: "right", marginTop: "8px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                    {formatDate(comment.createdAt)}
                </Text>
            </div>
        </Card>
    );
}

export default Comment;
