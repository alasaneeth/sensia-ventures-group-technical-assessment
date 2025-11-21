import { Tag, Card, Typography } from 'antd';
import { TagOutlined } from '@ant-design/icons';

/**
 * Component to display simplified offer information
 * @param {Object} props
 * @param {Object} props.offerData - The offer data to display
 */
function OfferDetails({ offerData }) {
    const { Paragraph, Text } = Typography;
    
    if (!offerData) {
        return (
            <div className="alert alert-warning" role="alert">
                No offer data available
            </div>
        );
    }

    const { data: offer } = offerData;

    if (!offer) {
        return (
            <div className="alert alert-warning" role="alert">
                Offer not found
            </div>
        );
    }

    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    <span>{offer.title || 'Untitled Offer'}</span>
                </div>
            }
            style={{ width: '100%' }}
        >
            <Typography>
                <div style={{ marginBottom: 16 }}>
                    <Text strong>Status: </Text>
                    <Tag color={offer.status === 'active' ? 'green' : 'orange'}>
                        {offer.status || 'Unknown'}
                    </Tag>
                </div>
                
                {offer.description && (
                    <div>
                        <Text strong>Description:</Text>
                        <Paragraph style={{ marginTop: 8 }}>
                            {offer.description}
                        </Paragraph>
                    </div>
                )}
            </Typography>
        </Card>
    );
}

export default OfferDetails;