import { useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import { MoreOutlined, LinkOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { addNodeToChain, removeNodeFromChain } from '../../redux/stateSlices/offersSlice';

function OfferActions({ record, onDelete, onUpdate }) {
    const chainOffers = useSelector((state) => state.offers.chainData.offers);
    const dispatch = useDispatch();
    
    // Check if offer is already in chain
    const isInChain = chainOffers && chainOffers[record.id.toString()];
    
    function handleToggleOffer() {
        if (isInChain) {
            // Remove from chain
            dispatch(removeNodeFromChain(record.id));
            message.success('Offer removed from chain');
        } else {
            // Add offer as a node to the chain
            dispatch(addNodeToChain({
                id: record.id,
                title: record.title,
                description: record.description,
                type: record.type,
            }));
            message.success('Offer added to chain');
        }
    }

    function handleDelete() {
        if (onDelete) {
            onDelete(record);
        }
    }

    function handleUpdate() {
        if (onUpdate) {
            onUpdate(record);
        }
    }

    // Action items for the dropdown menu
    const actionItems = [
        {
            key: 'update-offer',
            label: 'Update Offer',
            icon: <EditOutlined />,
            onClick: handleUpdate
        },
        {
            key: 'toggle-offer-chain',
            label: isInChain ? 'Remove from Chain' : 'Add to Chain',
            icon: <LinkOutlined />,
            onClick: handleToggleOffer
        },
        {
            key: 'delete-offer',
            label: 'Delete Offer',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: handleDelete
        },
    ];
    
    return (
        <>
            <Dropdown
                menu={{ items: actionItems }}
                placement="bottomRight"
                trigger={['click']}
            >
                <Button type="text" icon={<MoreOutlined />} className="icon-btn" />
            </Dropdown>
        </>
    );
}

export default OfferActions;
