import { forwardRef } from 'react';
import { Card, Button, Tooltip, Typography } from 'antd';
import { RightOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromOfferChain } from '../../redux/stateSlices/offersSlice';
import EditableDays from './EditableDays';
import EditableDate from './EditableDate';

const { Text } = Typography;

function OfferChainItems ({ scrollContainerRef }) {
    const dispatch = useDispatch();
    const offersChain = useSelector((state) => state.offers.offersChain);
    
    // Handle removing an offer from the chain
    const handleRemoveOffer = (id) => {
        dispatch(removeFromOfferChain(id));
    };
    
    return (
        <div className="offer-chain-items" ref={scrollContainerRef}>
            {offersChain.map((offer, index) => (
                <div key={offer.id} className="offer-chain-item">
                    <Card 
                        size="small"
                        title={offer.title || `Offer ${offer.id}`}
                        extra={
                            <Tooltip title="Remove from chain">
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<CloseCircleOutlined />} 
                                    onClick={() => handleRemoveOffer(offer.id)}
                                />
                            </Tooltip>
                        }
                    >
                        <div className="mb-2">
                            <Text strong>Offer ID: </Text>
                            <Text>{offer.id}</Text>
                        </div>
                        <div>
                            <Text strong>{index === 0 ? 'Ready at: ' : 'Days to activate (After order date): '}</Text>
                            {index === 0 ? (
                                <EditableDate 
                                    offerId={offer.id} 
                                    currentDays={offer.daysToAdd} 
                                />
                            ) : (
                                <EditableDays 
                                    offerId={offer.id} 
                                    currentDays={offer.daysToAdd} 
                                />
                            )}
                        </div>
                    </Card>
                    
                    {index < offersChain.length - 1 && (
                        <div className="arrow-connector">
                            <RightOutlined />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


export default OfferChainItems;
