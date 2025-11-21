import { Button, Dropdown, Modal } from "antd";
import {
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import AddPayment from "../../pages/accounting/AddPayment";
import { updatePayment } from "../../api/accounting";
import { message } from "antd";
import { useSelector } from "react-redux";

function PaymentActions({ record }) {
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const user = useSelector((state) => state.auth.user);

    // Action items for the dropdown menu
    const actionItems = [
        {
            key: "edit-payment",
            label: "Edit Payment",
            icon: <EditOutlined />,
            onClick: () => {
                setIsEditModalVisible(true);
            },
        },
        {
            key: "confirm-payment",
            label: "Confirm Payment",
            icon: <CheckCircleOutlined />,
            onClick: () => {
                setIsConfirmModalVisible(true);
            },
        },
        // {
        //     key: 'delete-payment',
        //     label: 'Delete Payment',
        //     icon: <DeleteOutlined />,
        //     danger: true,
        //     onClick: () => {
        //         // For now, just log the record - user will implement the delete functionality
        //         console.log('Delete payment:', record);
        //     }
        // },
    ];

    const handleModalClose = () => {
        setIsEditModalVisible(false);
    };

    const handleSubmit = async (changedData) => {
        try {
            const result = await updatePayment(record.id, changedData);

            if (result && result.data) {
                message.success("Payment updated successfully!");
                setIsEditModalVisible(false);
                // Optionally refresh the page or update the data
                window.location.reload();
            } else {
                message.error(typeof result === 'string' ? result : "Failed to update payment");
            }
        } catch (error) {
            console.error("Error updating payment:", error);
            message.error("Error updating payment");
        }
    };

    async function handleConfirm() {
        try {
            const result = await updatePayment(record.id, {
                confirmedById: user.id,
            });

            if (result && result.data) {
                message.success("Payment confirmed successfully!");
                setIsConfirmModalVisible(false);
                // Optionally refresh the page or update the data
                window.location.reload();
            } else {
                message.error(typeof result === 'string' ? result : "Failed to confirm payment");
            }
        } catch (err) {
            console.error("Error confirming payment:", err);
            message.error("Error confirming payment");
        }
    }

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
                open={isEditModalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={700}
            >
                <AddPayment
                    mode="Edit Payment"
                    initialValues={{
                        partner: record.partner,
                        amount: record.amount,
                        currency: record.currency,
                        createdAt: record.createdAt
                            ? new Date(record.createdAt)
                            : undefined,
                        brandId: record.brandId || record.brand?.id,
                        brand: record.brand,
                        company: record.brand?.company,
                    }}
                    onSubmit={handleSubmit}
                    onCancel={handleModalClose}
                />
            </Modal>

            <Modal
                open={isConfirmModalVisible}
                onOk={handleConfirm}
                onCancel={() => setIsConfirmModalVisible(false)}
                width={600}
                title="Confirm Payment"
                okText="Confirm Payment"
                okType="primary"
                cancelText="Cancel"
            >
                <div style={{ padding: "20px 0" }}>
                    <p style={{ fontSize: "16px", marginBottom: "16px" }}>
                        Are you sure you want to confirm this payment?
                    </p>
                    <div style={{
                        backgroundColor: "#f6ffed",
                        border: "1px solid #b7eb8f",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "16px"
                    }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "#52c41a" }}>
                            <strong>Payment Details:</strong>
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                            Partner: {record.partner}<br />
                            Amount: {record.currency} {record.amount}<br />
                            Created: {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                        This action cannot be undone. The payment will be marked as confirmed by you.
                    </p>
                </div>
            </Modal>
        </>
    );
}

export default PaymentActions;
