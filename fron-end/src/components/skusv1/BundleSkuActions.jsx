import React, { useState } from "react";
import { Dropdown, Menu, Button, Modal, message } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { deleteBundleSku } from "../../api/bundleSku";
import BundleSkuForm from "./BundleSkuForm";
import BundleSkuDetailsModal from "./BundleSkuDetailsModal";

function BundleSkuActions({ record, onRefresh }) {
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
            title: "Are you sure you want to delete this Bundle SKU?",
            content: `Bundle: ${record.bundleCode || record.bundleName}`,
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    const result = await deleteBundleSku(record.id);
                    if (result.success) {
                        message.success("Bundle SKU deleted successfully");
                        if (onRefresh) {
                            onRefresh();
                        }
                    } else {
                        message.error(result.message || "Failed to delete Bundle SKU");
                    }
                } catch (error) {
                    console.error("Error deleting Bundle SKU:", error);
                    message.error("Failed to delete Bundle SKU");
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
                title="Edit Bundle SKU"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={null}
                width={1000}
                destroyOnClose
            >
                <BundleSkuForm
                    mode="Update Bundle SKU"
                    initialValues={record}
                    onSuccess={() => {
                        setEditModalVisible(false);
                        if (onRefresh) {
                            onRefresh();
                        }
                    }}
                />
            </Modal>

            <BundleSkuDetailsModal
                visible={viewModalVisible}
                bundleSku={record}
                onClose={() => setViewModalVisible(false)}
            />
        </>
    );
}

export default BundleSkuActions;

