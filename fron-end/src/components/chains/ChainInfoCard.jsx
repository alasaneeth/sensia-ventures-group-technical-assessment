import { Card, Typography } from "antd";

const { Title, Text } = Typography;

function ChainInfoCard({ chain }) {
    if (!chain) return null;

    return (
        <Card>
            <Title level={2}>
                {" "}
                Chain Code: <Title level={3}>{chain.title}</Title>
            </Title>

            {/* <div style={{ margin: '16px 0' }}>
                <Text strong>Description: </Text>
                <Text>{chain.description || 'No description provided'}</Text>
            </div> */}

            {/* <div style={{ margin: '16px 0' }}>
                <Text strong>Created: </Text>
                <Text>{new Date(chain.createdAt).toLocaleDateString()}</Text>
            </div> */}
        </Card>
    );
}

export default ChainInfoCard;
