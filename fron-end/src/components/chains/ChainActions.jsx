import { Button, Dropdown } from 'antd';
import { MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

function ChainActions({ record, onUpdate, onDelete }) {
    const navigate = useNavigate();
    
    const handleViewSequences = (chainId) => {
        navigate(`/offers-chains/${chainId}`);
    };
    
    // Action items for the dropdown menu
    const actionItems = [
        {
            key: 'view-offers',
            label: 'View Offers',
            icon: <EyeOutlined />,
            onClick: () => handleViewSequences(record.id)
        },
        {
            key: 'update-chain',
            label: 'Update Chain',
            icon: <EditOutlined />,
            onClick: () => onUpdate && onUpdate(record)
        },
        {
            key: 'delete-chain',
            label: 'Delete Chain',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete && onDelete(record)
        }
    ];
    
    return (
        <Dropdown
            menu={{ items: actionItems }}
            placement="bottomRight"
            trigger={['click']}
        >
            <Button type="text" icon={<MoreOutlined />} className="icon-btn" />
        </Dropdown>
    );
}

export default ChainActions;
