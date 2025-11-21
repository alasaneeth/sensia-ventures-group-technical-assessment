import { Handle, Position } from "@xyflow/react";
import { Card, Typography, Tag } from "antd";

const { Text, Title } = Typography;

function ChainNode({ data, isConnectable }) {
    // Determine styling based on node state
    const getNodeStyle = () => {
        if (data.isActive) {
            return {
                border: "3px solid #faad14",
                boxShadow: "0 4px 12px rgba(250, 173, 20, 0.4)",
                backgroundColor: "#fffbe6",
            };
        } else if (data.isFirst) {
            return {
                border: "3px solid #52c41a",
                boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
                backgroundColor: "#f6ffed",
            };
        } else {
            return {
                border: "2px solid #1890ff",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
            };
        }
    };

    return (
        <Card
            size="small"
            className="chain-node"
            style={{
                minWidth: 200,
                borderRadius: "8px",
                ...getNodeStyle(),
            }}
        >
            <div>
                {data.isActive && (
                    <Tag
                        color="orange"
                        style={{ marginBottom: 8, fontSize: "10px" }}
                    >
                        ACTIVE
                    </Tag>
                )}
                {data.isFirst && !data.isActive && (
                    <Tag
                        color="green"
                        style={{ marginBottom: 8, fontSize: "10px" }}
                    >
                        START
                    </Tag>
                )}
                <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                    {data.title || `Offer ${data.offerId}`}
                </Title>

                {data.description && (
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                        {data.description}
                    </Text>
                )}

                {!data.isFirst &&
                    data.daysToAdd !== undefined &&
                    data.daysToAdd !== null && (
                        <div style={{ marginTop: 8 }}>
                            <Tag color="blue">+{data.daysToAdd} days</Tag>
                        </div>
                    )}
            </div>

            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: "#ff4d4f",
                    width: 12,
                    height: 12,
                    border: "2px solid #fff",
                }}
                isConnectable={isConnectable}
            />

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: "#52c41a",
                    width: 12,
                    height: 12,
                    border: "2px solid #fff",
                }}
                isConnectable={isConnectable}
            />
        </Card>
    );
}

export default ChainNode;
