import { Button, Dropdown } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

function CompanyActions({ record, onUpdate, onDelete }) {
    // Action items for the dropdown menu
    const actionItems = [
        {
            key: 'update-company',
            label: 'Update Company',
            icon: <EditOutlined />,
            onClick: () => onUpdate && onUpdate(record)
        },
        {
            key: 'delete-company',
            label: 'Delete Company',
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

export default CompanyActions;

