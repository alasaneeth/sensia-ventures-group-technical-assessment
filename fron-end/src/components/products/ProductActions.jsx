import { Button, Dropdown, Modal } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function ProductActions({ record, onUpdate, onDelete }) {
    const navigate = useNavigate();
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

    const handleAddVariation = () => {
        // Navigate to add product variation page with pre-filled params
        const params = new URLSearchParams({
            companyId: record.brand?.companyId || '',
            brandId: record.brandId || '',
            productId: record.id || ''
        });
        navigate(`/products/add-product-variation?${params.toString()}`);
    };

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
            key: 'add-variation',
            label: 'Add Product Variation',
            icon: <PlusOutlined />,
            onClick: handleAddVariation
        },
        {
            key: 'update-product',
            label: 'Update Product',
            icon: <EditOutlined />,
            onClick: () => onUpdate && onUpdate(record)
        },
        {
            key: 'delete-product',
            label: 'Delete Product',
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
                title="Delete Product"
                open={isDeleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="Delete"
                okButtonProps={{ danger: true }}
            >
                <p>
                    Are you sure you want to delete the product{" "}
                    <strong>{record.name}</strong>? This action cannot be undone.
                </p>
            </Modal>
        </>
    );
}

export default ProductActions;
