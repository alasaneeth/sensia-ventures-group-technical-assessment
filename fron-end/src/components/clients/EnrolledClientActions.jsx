import { useState } from 'react';
import { Button, Dropdown, Modal, message } from 'antd';
import { MoreOutlined, EyeOutlined, StopOutlined, ShoppingCartOutlined, TagOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ShowOffer from '../offers/ShowOffer';
import ShowCampagin from '../campaigns/ShowCampagin';
import ShowJourney from '../chains/ShowJourney';

/**
 * Component for displaying actions for enrolled clients in a dropdown menu
 * @param {Object} props
 * @param {Object} props.record - The client offer record
 * @param {Function} props.onRefresh - Function to refresh data after actions
 */
function EnrolledClientActions({ record, onRefresh }) {
    console.log("This is the record: ", record);
    const navigate = useNavigate();
    
    // Track which model is opened
    const [currModel, setCurrModel] = useState(null);
    // Track which title must be
    const [curTitle, setCurTitle] = useState(null);
    // The id we are sending to the modal
    const [curId, setCurId] = useState(null);

    // Handle viewing client journey
    function handleViewJourney() {
        setCurTitle(`Tho journy for ${record.client?.firstName || 'Client'}`)

        // Send the chain id and the current offer
        setCurId({
            chainId: record.chainId,
            currSeq: record.currentSequenceId
        })
        setCurrModel('journey');
    }

    // Handle toggling blacklist status
    function handleToggleBlacklist() {
        setCurTitle(`Are you sure you want to add client ${record.client.firstName} to black list ?`);
        setCurrModel('balckList');
        // Handle logic here
    }

    // Handle placing an order
    function handlePlaceOrder() {
        setCurTitle(`Placing an order for client ${record.client.firstName} ?`);
        setCurrModel('order');

        // Chain_campagin_id which contains all the infromation (client id, chain id and campaign id)
        navigate(`/orders/${record.id}/placement`);
    }
    
    // Handle showing offer details
    function handleShowOfferDetails() {
        setCurTitle(`The offer ${record.currentSequence.offer.title}`)
        const offerId = record.currentSequence.offer.id;
        if (offerId === null || offerId === undefined) {
            message.error('No offer available for this client');
            return;
        }
        setCurId(offerId);
        setCurrModel('offer');
    }
    
    // Handle showing campaign details
    function handleShowCampaignDetails() {
        setCurTitle(`The campaign ${record.campaign.title}`)
        setCurrModel('campaign');
        const campaignId = record.campaign?.id;
        if (campaignId === null || campaignId === undefined) {
            message.error('No campaign available for this client');
            return;
        }
        setCurId(record.campaign.id)
    }

    // Clear the entire state
    function cleareState() {
        setCurId(null);
        setCurTitle(null);
        setCurrModel(null);
    }
    
    // Action items for the dropdown menu
    const actionItems = [
        // {
        //     key: 'view-journey',
        //     label: 'View Journey',
        //     icon: <EyeOutlined />,
        //     onClick: handleViewJourney
        // },
        {
            key: 'show-offer-details',
            label: 'Show Offer Details',
            icon: <TagOutlined />,
            onClick: handleShowOfferDetails
        },
        {
            key: 'show-campaign-details',
            label: 'Show Campaign Details',
            icon: <AppstoreOutlined />,
            onClick: handleShowCampaignDetails
        },
        {
            key: 'place-order',
            label: 'Place Order',
            icon: <ShoppingCartOutlined />,
            onClick: handlePlaceOrder
        },
        {
            key: 'toggle-blacklist',
            label: record.isBlackList ? 'Remove from Blacklist' : 'Add to Blacklist',
            icon: <StopOutlined />,
            danger: !record.isBlackList,
            onClick: handleToggleBlacklist
        },
    ];
    
    // Calculate modal height based on viewport
    const getModalStyle = () => {
        // Set maximum height to 80% of viewport height
        const maxHeight = window.innerHeight * 0.8;
        return {
            maxHeight: `${maxHeight}px`,
            overflow: 'auto'
        };
    };
    
    return (
        <>
            <Dropdown
                menu={{ items: actionItems }}
                placement="bottomRight"
                trigger={['click']}
            >
                <Button type="text" icon={<MoreOutlined />} className="icon-btn" />
            </Dropdown>
            
            {/* TODO: Conditionaly render it if there is no current model */}
            <Modal
                title={curTitle}
                open={currModel !== null}
                onCancel={cleareState}
                footer={null}
                width={600}
                modalRender={(node) => (
                    <div style={{ position: 'relative' }}>
                        {node}
                    </div>
                )}
                styles={{ 
                    header: { 
                        position: 'sticky', 
                        top: 0, 
                        zIndex: 1, 
                        backgroundColor: '#fff',
                        padding: '16px 24px',
                        borderBottom: '1px solid #f0f0f0'
                    },
                    body: { 
                        maxHeight: `${window.innerHeight * 0.7}px`,
                        overflow: 'auto'
                    }
                }}
            >
                <div style={getModalStyle()}>
                    {currModel === "offer" && <ShowOffer offerId={curId} />}
                    
                    {currModel === "campaign" && <ShowCampagin campaignId={curId} />}
                    
                    {currModel === "journey" && <ShowJourney data={curId} />}
                </div>
            </Modal>
        </>
    );
}

export default EnrolledClientActions;
