import React, { useState } from "react";
import { Dropdown, Menu, Button, Modal, message } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { deleteProductSku } from "../../api/productSku";
import SkuForm from "./SkuForm";
import SkuDetailsModal from "./SkuDetailsModal";

function SkuActions({ record, onRefresh }) {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);

    const handleEdit = () => {
        setEditModalVisible(true);
    };

    const handleView = () => {
        setViewModalVisible(true);
    };

    const handleDelete = () => {
        Modal.confirm({
            title: "Are you sure you want to delete this SKU?",
            content: `SKU: ${record.skuCode || record.title}`,
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    const result = await deleteProductSku(record.id);
                    if (result.success) {
                        message.success("SKU deleted successfully");
                        if (onRefresh) {
                            onRefresh();
                        }
                    } else {
                        message.error(result.message || "Failed to delete SKU");
                    }
                } catch (error) {
                    console.error("Error deleting SKU:", error);
                    message.error("Failed to delete SKU");
                }
            },
        });
    };

    const menu = (
        <Menu>
            <Menu.Item key="view" icon={<EyeOutlined />} onClick={handleView}>
                View Details
            </Menu.Item>
            <Menu.Item key="edit" icon={<EditOutlined />} onClick={handleEdit}>
                Edit
            </Menu.Item>
            <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={handleDelete}
            >
                Delete
            </Menu.Item>
        </Menu>
    );

    return (
        <>
            <Dropdown overlay={menu} trigger={["click"]}>
                <Button
                    type="text"
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                />
            </Dropdown>

            <Modal
                title="Edit SKU"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={null}
                width={1000}
                destroyOnClose
            >
                <SkuForm
                    mode="Update SKU"
                    initialValues={record}
                    onSuccess={() => {
                        setEditModalVisible(false);
                        if (onRefresh) {
                            onRefresh();
                        }
                    }}
                />
            </Modal>

            <SkuDetailsModal
                visible={viewModalVisible}
                sku={record}
                onClose={() => setViewModalVisible(false)}
            />
        </>
    );
}

export default SkuActions;

