import { Button, Dropdown, Modal } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";

function CategoryActions({ record, onUpdate, onDelete }) {
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
            key: 'update-category',
            label: 'Update Category',
            icon: <EditOutlined />,
            onClick: () => onUpdate && onUpdate(record)
        },
        {
            key: 'delete-category',
            label: 'Delete Category',
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
                title="Delete Category"
                open={isDeleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="Delete"
                okButtonProps={{ danger: true }}
            >
                <p>
                    Are you sure you want to delete the category{" "}
                    <strong>{record.name}</strong>? This action cannot be undone.
                </p>
            </Modal>
        </>
    );
}

export default CategoryActions;
