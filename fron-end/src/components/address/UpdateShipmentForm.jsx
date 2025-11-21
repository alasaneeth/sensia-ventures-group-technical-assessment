import {
    Form,
    Input,
    InputNumber,
    DatePicker,
    Checkbox,
    Button,
    message,
} from "antd";
import { useState, useEffect, useRef } from "react";
import { updateShipment } from "../../api/addresses";
import dayjs from "dayjs";

function UpdateShipmentForm({ shipment, onSuccess, onCancel }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    
    // Store original data for comparison to only send changed fields
    const originalData = useRef({});

    // Set initial form values when shipment data is available
    useEffect(() => {
        if (shipment) {
            // Store original data
            originalData.current = {
                deliveryCourrier: shipment.deliveryCourrier,
                trackingNumber: shipment.trackingNumber,
                numberOfLetters: shipment.numberOfLetters,
                weight: shipment.weight,
                receivingDate: shipment.receivingDate,
                createdAt: shipment.createdAt,
                received: shipment.received || false,
            };
            
            // Set form initial values
            form.setFieldsValue({
                deliveryCourrier: shipment.deliveryCourrier,
                trackingNumber: shipment.trackingNumber,
                numberOfLetters: shipment.numberOfLetters,
                weight: shipment.weight,
                receivingDate: shipment.receivingDate
                    ? dayjs(shipment.receivingDate)
                    : null,
                createdAt: shipment.createdAt ? dayjs(shipment.createdAt) : null,
                received: shipment.received || false,
            });
        }
    }, [shipment, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Only send fields that have changed
            const changedValues = {};
            
            // Check each field for changes
            if (values.deliveryCourrier !== originalData.current.deliveryCourrier) {
                changedValues.deliveryCourrier = values.deliveryCourrier;
            }
            
            if (values.trackingNumber !== originalData.current.trackingNumber) {
                changedValues.trackingNumber = values.trackingNumber;
            }
            
            if (values.numberOfLetters !== originalData.current.numberOfLetters) {
                changedValues.numberOfLetters = values.numberOfLetters;
            }
            
            if (values.weight !== originalData.current.weight) {
                changedValues.weight = values.weight;
            }
            
            // Check receivingDate
            const newReceivingDate = values.receivingDate
                ? values.receivingDate.format("YYYY-MM-DD")
                : null;
            if (newReceivingDate !== originalData.current.receivingDate) {
                changedValues.receivingDate = newReceivingDate;
            }
            
            // Check createdAt
            const newCreatedAt = values.createdAt
                ? values.createdAt.format("YYYY-MM-DD")
                : null;
            if (newCreatedAt !== originalData.current.createdAt) {
                changedValues.createdAt = newCreatedAt;
            }
            
            // Check received
            const newReceived = values.received || false;
            if (newReceived !== originalData.current.received) {
                changedValues.received = newReceived;
            }

            // If no changes, show message and return
            if (Object.keys(changedValues).length === 0) {
                message.info("No changes detected");
                setLoading(false);
                return;
            }

            console.log("Changed fields to be updated:", changedValues);

            // Use the updateShipment API function
            const result = await updateShipment(shipment.id, changedValues);
            if (typeof result === 'string') {
                message.error(result);
            } else {
                message.success("Shipment updated successfully!");
                onSuccess?.(result);
            }
        } catch (error) {
            console.error("Error updating shipment:", error);
            message.error("Error updating shipment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
                received: false,
            }}
        >
            <Form.Item
                label="Delivery Courier"
                name="deliveryCourrier"
            >
                <Input placeholder="Enter delivery courier name" />
            </Form.Item>

            <Form.Item
                label="Tracking Number"
                name="trackingNumber"
            >
                <Input placeholder="Enter tracking number" />
            </Form.Item>

            <Form.Item
                label="Number of Letters"
                name="numberOfLetters"
            >
                <InputNumber
                    placeholder="Enter number of letters"
                    style={{ width: "100%" }}
                    min={1}
                />
            </Form.Item>

            <Form.Item label="Weight" name="weight">
                <Input placeholder="Enter weight (e.g., 2.5 kg)" />
            </Form.Item>

            <Form.Item label="Receiving Date" name="receivingDate">
                <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Shipment Date" name="createdAt">
                <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="received" valuePropName="checked">
                <Checkbox>Mark as received</Checkbox>
            </Form.Item>

            <Form.Item>
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                    }}
                >
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Update Shipment
                    </Button>
                </div>
            </Form.Item>
        </Form>
    );
}

export default UpdateShipmentForm;
