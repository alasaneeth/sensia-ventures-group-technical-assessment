import { Button, Dropdown, Modal } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";

function SkuActions({ record, onUpdate, onDelete }) {
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleteModalVisible(true);
    };

    const handleDeleteConfirm = () => {
        if (onDelete) {
            onDelete(record);
        }
        setIsDeleteModalVisible(false);
    };

    // Action items for the dropdown menu
    const actionItems = [
        {
            key: 'update-sku',
            label: 'Update SKU',
            icon: <EditOutlined />,
            onClick: () => onUpdate && onUpdate(record)
        },
        {
            key: 'delete-sku',
            label: 'Delete SKU',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: handleDeleteClick
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

            <Modal
                title="Delete SKU"
                open={isDeleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="Delete"
                okButtonProps={{ danger: true }}
            >
                <p>
                    Are you sure you want to delete the SKU{" "}
                    <strong>{record.code}</strong>? This action cannot be undone.
                </p>
            </Modal>
        </>
    );
}

export default SkuActions;
