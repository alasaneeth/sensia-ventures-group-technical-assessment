import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { createBrand } from "../../api/brands";

function BrandForm({ companyId, onSuccess }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Handle form submission
    async function handleSubmit(values) {
        setLoading(true);
        try {
            // Only send fields that match the model
            const formattedValues = {
                name: values.name,
                description: values.description || null,
            };

            const response = await createBrand(companyId, formattedValues);
            
            if (typeof response === "string") {
                message.error(response);
                return;
            }

            message.success("Brand created successfully");

            // Reset the form
            handleReset();

            // Call onSuccess callback if provided
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Error creating brand:", error);
            message.error("Failed to create brand");
        } finally {
            setLoading(false);
        }
    }

    // Handle form reset
    function handleReset() {
        form.resetFields();
    }

    return (
        <Card>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={loading}
            >
                <Form.Item
                    name="name"
                    label="Brand Name"
                    rules={[
                        { required: true, message: "Please enter Brand Name" },
                    ]}
                >
                    <Input placeholder="Enter Brand Name" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea 
                        placeholder="Enter Brand Description (optional)" 
                        rows={4}
                    />
                </Form.Item>

                <Form.Item>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px",
                        }}
                    >
                        <Button onClick={handleReset}>Reset</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            Create Brand
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default BrandForm;

