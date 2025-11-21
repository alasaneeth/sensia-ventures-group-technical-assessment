import { Button, Dropdown } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

function BrandActions({ record, onUpdate, onDelete }) {
    // Action items for the dropdown menu
    const actionItems = [
        {
            key: 'update-brand',
            label: 'Update Brand',
            icon: <EditOutlined />,
            onClick: () => onUpdate && onUpdate(record)
        },
        {
            key: 'delete-brand',
            label: 'Delete Brand',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete && onDelete(record)
        }
    ];

    return (
        <>
            <Dropdown
                menu={{ items: actionItems }}
                placement="bottomRight"
                trigger={["click"]}
            >
                <Button
                    type="text"
                    icon={<MoreOutlined />}
                    className="icon-btn"
                />
            </Dropdown>
        </>
    );
}

export default BrandActions;

