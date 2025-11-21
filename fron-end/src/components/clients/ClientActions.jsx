import { Button, Dropdown } from "antd";
import {
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

function ClientActions({ record }) {
    const navigate = useNavigate();

    // Action items for the dropdown menu
    const actionItems = [
        // {
        //     key: 'view-client',
        //     label: 'View Details',
        //     icon: <EyeOutlined />,
        //     onClick: () => navigate(`/database/${record.id}`)
        // },
        // {
        //     key: 'edit-client',
        //     label: 'Edit Client',
        //     icon: <EditOutlined />,
        //     onClick: () => navigate(`/database/edit/${record.id}`)
        // },
        // {
        //     key: 'delete-client',
        //     label: 'Delete Client',
        //     icon: <DeleteOutlined />,
        //     danger: true,
        //     onClick: () => {
        //         // Implement delete confirmation modal here
        //         console.log('Delete client:', record.id);
        //     }
        // },
    ];

    return (
        <Dropdown
            menu={{ items: actionItems }}
            placement="bottomRight"
            trigger={["click"]}
            onOpenChange={() => console.log(record)}
        >
            <Button type="text" icon={<MoreOutlined />} className="icon-btn" />
        </Dropdown>
    );
}

export default ClientActions;
