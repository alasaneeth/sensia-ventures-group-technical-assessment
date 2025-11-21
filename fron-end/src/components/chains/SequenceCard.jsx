import { Card, Typography, Space, Tag } from 'antd';
import { RightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function SequenceCard({ sequence, isLast }) {
    return (
        <Card size="small" className="mb-3">
            <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                    <Title level={4} className="mb-2">
                        {sequence.offerData.title}
                    </Title>
                    <Text type="secondary" className="d-block mb-2">
                        {sequence.offerData.description}
                    </Text>
                    <Space direction="vertical" className="w-100">
                        <Space>
                            <Tag color="blue">Offer ID: {sequence.offerId}</Tag>
                            <Tag color="green">Sequence ID: {sequence.sequenceId}</Tag>
                        </Space>
                        <div>
                            <Tag color="orange" className="mt-2">
                                Days to activate after order date: {sequence.daysToAdd}
                            </Tag>
                        </div>
                    </Space>
                </div>
                {!isLast && (
                    <RightOutlined className="text-primary ms-3" style={{ fontSize: '16px' }} />
                )}
            </div>
        </Card>
    );
}

export default SequenceCard;
