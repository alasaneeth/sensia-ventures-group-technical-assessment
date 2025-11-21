import { Button, Dropdown, Modal, message } from "antd";
import {
    MoreOutlined,
    EyeOutlined,
    DeleteOutlined,
    EditOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { deleteOrder } from "../../api/order";
import UpdateOrderForm from "./UpdateOrderForm";

function OrderActions({ record, fetchOrders, onOrderDeleted }) {
    const navigate = useNavigate();
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);

    const handleDelete = async () => {
        try {
            setLoading(true);
            const result = await deleteOrder(record.id);

            if (result !== true && typeof result === "string") {
                message.error(result);
            } else {
                message.success("Order deleted successfully");
                setIsDeleteModalVisible(false);
                // Remove order from table instead of reloading
                if (onOrderDeleted) {
                    onOrderDeleted(record.id);
                } else {
                    fetchOrders();
                }
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            message.error("Failed to delete order");
        } finally {
            setLoading(false);
        }
    };

    // Action items for the dropdown menu
    const actionItems = [
        {
            key: "update-order",
            label: "Update Order",
            icon: <EditOutlined />,
            onClick: () => {
                setIsUpdateModalVisible(true);
            },
        },
        {
            key: "delete-order",
            label: "Delete Order",
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
                setIsDeleteModalVisible(true);
            },
        },
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
                title="Delete Order"
                open={isDeleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                confirmLoading={loading}
                okText="Delete"
                okButtonProps={{ danger: true }}
            >
                <p>
                    Are you sure you want to delete order{" "}
                    <strong>{record.id}</strong>? This action cannot be undone.
                </p>
            </Modal>

            <Modal
                title={`Update Order #${record?.id}`}
                open={isUpdateModalVisible}
                onCancel={() => setIsUpdateModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <UpdateOrderForm
                    order={record}
                    onUpdated={() => {
                        // Refresh orders on successful update to reflect new values
                        setIsUpdateModalVisible(false);
                        if (fetchOrders) {
                            fetchOrders();
                        }
                    }}
                />
            </Modal>
        </>
    );
}

export default OrderActions;
