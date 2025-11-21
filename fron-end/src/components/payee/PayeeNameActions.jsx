import { Button, Dropdown, message } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

function PayeeNameActions({ record, onUpdate, onDelete }) {
    // Action items for the dropdown menu
    const actionItems = [
        {
            key: 'update-payee',
            label: 'Update Payee Name',
            icon: <EditOutlined />,
            onClick: () => onUpdate && onUpdate(record)
        },
        {
            key: 'delete-payee',
            label: 'Delete Payee Name',
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

export default PayeeNameActions;
