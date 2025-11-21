import {
    Form,
    Input,
    InputNumber,
    DatePicker,
    Checkbox,
    Button,
    message,
} from "antd";
import { useState } from "react";
import { addShipment } from "../../api/addresses";

function AddShipmentForm({ addressId, onSuccess, onCancel }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Format the data
            const shipmentData = {
                deliveryCourrier: values.deliveryCourrier,
                trackingNumber: values.trackingNumber,
                numberOfLetters: values.numberOfLetters,
                weight: values.weight,
                receivingDate: values.receivingDate
                    ? values.receivingDate.format("YYYY-MM-DD")
                    : null,
                received: values.received || false,
                createdAt: values.createdAt
            };

            console.log("Shipment data to be submitted:", shipmentData);

            // Use the addShipment API function
            const result = await addShipment(addressId, shipmentData);
            if (!result)
                message.error("Failed to create shipment");
            else {
                message.success("Shipment created successfully!");
                form.resetFields();
                onSuccess?.();
            }
        } catch (error) {
            console.error("Error creating shipment:", error);
            message.error("Error creating shipment");
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
                rules={[
               
                ]}
            >
                <Input placeholder="Enter delivery courier name" />
            </Form.Item>

            <Form.Item
                label="Tracking Number"
                name="trackingNumber"
                rules={[

                ]}
            >
                <Input placeholder="Enter tracking number" />
            </Form.Item>

            <Form.Item
                label="Number of Letters"
                name="numberOfLetters"
                rules={[

                    {
                        type: "number",
                        min: 1,
                        message: "Number must be at least 1",
                    },
                ]}
            >
                <InputNumber
                    placeholder="Enter number of letters"
                    style={{ width: "100%" }}
                    min={1}
                />
            </Form.Item>

            <Form.Item
                label="Weight"
                name="weight"
                rules={[

                ]}
            >
                <Input placeholder="Enter weight (e.g., 2.5 kg)" />
            </Form.Item>

            <Form.Item
                label="Receiving Date"
                name="receivingDate"
                rules={[
  
                ]}
            >
                <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
                label="Shipment Date"
                name="createdAt"
                rules={[
  
                ]}
            >
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
                        Create Shipment
                    </Button>
                </div>
            </Form.Item>
        </Form>
    );
}

export default AddShipmentForm;
