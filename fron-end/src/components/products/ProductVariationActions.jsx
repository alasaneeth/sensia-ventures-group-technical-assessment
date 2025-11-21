import { Button, Dropdown, Modal } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";

function ProductVariationActions({ record, onUpdate, onDelete }) {
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
            key: 'update-product-variation',
            label: 'Update Product Variation',
            icon: <EditOutlined />,
            onClick: () => onUpdate && onUpdate(record)
        },
        {
            key: 'delete-product-variation',
            label: 'Delete Product Variation',
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
                title="Delete Product Variation"
                open={isDeleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="Delete"
                okButtonProps={{ danger: true }}
            >
                <p>
                    Are you sure you want to delete the product variation{" "}
                    <strong>{record.code}</strong>? This action cannot be undone.
                </p>
            </Modal>
        </>
    );
}

export default ProductVariationActions;
