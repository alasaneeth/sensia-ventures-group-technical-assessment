import { Button, Dropdown, Modal, message, DatePicker } from "antd";
import { MoreOutlined, CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { updateShipment } from "../../api/addresses";
import dayjs from "dayjs";
import formatDateForPostgres from "../../util/formatDateForPostgres";
import UpdateShipmentForm from "./UpdateShipmentForm";
import { FaAddressCard } from "react-icons/fa6";

function ShipmentActions({ record, setShipments }) {
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [shipmentDate, setShipmentDate] = useState(null);
    const [receivingDate, setReceivingDate] = useState(null);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [isDataEntryModalVisible, setIsDataEntryModalVisible] = useState(false);
    const [dataEntryFinishedDate, setDataEntryFinishedDate] = useState(null);

    // Action items for the dropdown menu
    const actionItems = [];

    // Update action - always visible
    actionItems.push({
        key: "update",
        label: "Update",
        icon: <EditOutlined />,
        onClick: () => {
            setIsUpdateModalVisible(true);
        },
    });

    if (!record.received) {
        actionItems.push({
            key: "mark-received",
            label: "Mark as Received",
            icon: <CheckCircleOutlined />,
            onClick: () => {
                setIsConfirmModalVisible(true);
            },
        });
    }

    // Data entry finished date action - always visible
    actionItems.push({
        key: "data-entry-finished",
        icon: <FaAddressCard />,
        label: "Set Data Entry Finished Date",
        onClick: () => {
            setIsDataEntryModalVisible(true);
        },
    });

    const handleMarkReceived = async () => {
        try {
            const updateData = {
                received: true,
                receivingDate: receivingDate
                    ? formatDateForPostgres(receivingDate)
                    : formatDateForPostgres(dayjs()),
            };

            // Add createdAt if shipment date is provided
            if (shipmentDate) {
                updateData.createdAt = formatDateForPostgres(shipmentDate);
            }

            const result = await updateShipment(record.id, updateData);

            if (typeof result !== "string") {
                message.success("Shipment marked as received successfully!");
                setIsConfirmModalVisible(false);

                // Update only the specific shipment in the shipments array
                setShipments((prevShipments) =>
                    prevShipments.map((shipment) => {
                        if (shipment.id === record.id) {
                            return result;
                        }

                        return shipment;
                    })
                );
            } else {
                message.error("Failed to mark shipment as received");
            }
        } catch (err) {
            console.error("Error marking shipment as received:", err);
            message.error("Error marking shipment as received");
        }
    };

    const handleModalCancel = () => {
        setIsConfirmModalVisible(false);
        setShipmentDate(null);
        setReceivingDate(null);
    };

    const handleDataEntryFinished = async () => {
        try {
            const updateData = {
                dataEntryFinishedDate: dataEntryFinishedDate
                    ? formatDateForPostgres(dataEntryFinishedDate)
                    : formatDateForPostgres(dayjs()),
            };

            const result = await updateShipment(record.id, updateData);

            if (typeof result !== "string") {
                message.success("Data entry finished date set successfully!");
                setIsDataEntryModalVisible(false);

                // Update the shipment in the list
                setShipments((prevShipments) =>
                    prevShipments.map((shipment) => {
                        if (shipment.id === record.id) {
                            return result;
                        }

                        return shipment;
                    })
                );
            } else {
                message.error("Failed to set data entry finished date");
            }
        } catch (err) {
            console.error("Error setting data entry finished date:", err);
            message.error("Error setting data entry finished date");
        }
    };

    const handleDataEntryCancel = () => {
        setIsDataEntryModalVisible(false);
        setDataEntryFinishedDate(null);
    };

    const handleUpdateSuccess = (updatedShipment) => {
        setIsUpdateModalVisible(false);
        // Update the shipment in the list
        setShipments((prevShipments) =>
            prevShipments.map((shipment) =>
                shipment.id === record.id ? updatedShipment : shipment
            )
        );
    };

    const handleUpdateCancel = () => {
        setIsUpdateModalVisible(false);
    };

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
                open={isConfirmModalVisible}
                onOk={handleMarkReceived}
                onCancel={handleModalCancel}
                width={600}
                title="Mark Shipment as Received"
                okText="Mark as Received"
                okType="primary"
                cancelText="Cancel"
            >
                <div style={{ padding: "20px 0" }}>
                    <p style={{ fontSize: "16px", marginBottom: "16px" }}>
                        Are you sure you want to mark this shipment as received?
                    </p>
                    <div style={{ marginBottom: "16px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: "500",
                            }}
                        >
                            Shipment Date (Optional)
                        </label>
                        <DatePicker
                            style={{ width: "100%" }}
                            value={shipmentDate}
                            onChange={(date) => setShipmentDate(date)}
                            placeholder="Select shipment date"
                        />
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: "500",
                            }}
                        >
                            Receiving Date (Optional)
                        </label>
                        <DatePicker
                            style={{ width: "100%" }}
                            value={receivingDate}
                            onChange={(date) => setReceivingDate(date)}
                            placeholder="Select receiving date"
                        />
                    </div>
                    <div
                        style={{
                            backgroundColor: "#f6ffed",
                            border: "1px solid #b7eb8f",
                            padding: "12px",
                            borderRadius: "6px",
                            marginBottom: "16px",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: "14px",
                                color: "#52c41a",
                            }}
                        >
                            <strong>Shipment Details:</strong>
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                            Delivery Courier: {record.deliveryCourrier}
                            <br />
                            Tracking Number: {record.trackingNumber}
                            <br />
                            Number of Letters: {record.numberOfLetters}
                            <br />
                            Weight: {record.weight}
                            <br />
                            Receiving Date:{" "}
                            {record.receivingDate
                                ? new Date(
                                      record.receivingDate
                                  ).toLocaleDateString()
                                : "N/A"}
                        </p>
                    </div>
                    <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                        This action cannot be undone. The shipment will be
                        marked as received.
                    </p>
                </div>
            </Modal>

            <Modal
                open={isUpdateModalVisible}
                onCancel={handleUpdateCancel}
                footer={null}
                width={600}
                title="Update Shipment"
            >
                <UpdateShipmentForm
                    shipment={record}
                    onSuccess={handleUpdateSuccess}
                    onCancel={handleUpdateCancel}
                />
            </Modal>

            <Modal
                open={isDataEntryModalVisible}
                onOk={handleDataEntryFinished}
                onCancel={handleDataEntryCancel}
                width={600}
                title="Set Data Entry Finished Date"
                okText="Set Date"
                okType="primary"
                cancelText="Cancel"
            >
                <div style={{ padding: "20px 0" }}>
                    <p style={{ fontSize: "16px", marginBottom: "16px" }}>
                        Set the date when data entry was finished for this shipment.
                    </p>
                    <div style={{ marginBottom: "16px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: "500",
                            }}
                        >
                            Data Entry Finished Date (Optional)
                        </label>
                        <DatePicker
                            style={{ width: "100%" }}
                            value={dataEntryFinishedDate}
                            onChange={(date) => setDataEntryFinishedDate(date)}
                            placeholder="Select data entry finished date"
                        />
                    </div>
                    <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
                        If no date is selected, today's date will be used.
                    </p>
                </div>
            </Modal>
        </>
    );
}

export default ShipmentActions;
