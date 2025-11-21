import React from "react";
import { Card, Typography } from "antd";
import CommentsList from "./CommentsList";

const { Title } = Typography;

/**
 * ClientComments component to display comments for a specific client
 *
 * @param {Object} props
 * @param {string} props.clientId - The client ID to fetch comments for
 * @param {string} props.clientName - The client name to display in the title
 */
function ClientComments({ clientId, clientName }) {
    console.log("What is ", clientId);
    return (
        <Card
            title={
                <Title level={4}>
                    {clientName
                        ? `Comments for ${clientName}`
                        : "Client Comments"}
                </Title>
            }
            style={{ marginBottom: "24px", height: "100%", overflow: "auto" }}
            styles={{ body: { height: "85%"} }}
        >
            {clientId ? (
                <CommentsList clientId={clientId} />
            ) : (
                <Typography.Text type="secondary">
                    Select a client to view and add comments
                </Typography.Text>
            )}
        </Card>
    );
}

export default ClientComments;
