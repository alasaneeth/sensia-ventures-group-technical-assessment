import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { createCompany } from "../../api/companies";

function CompanyForm() {
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

            console.log(formattedValues);
            const response = await createCompany(formattedValues);
            
            if (typeof response === "string") {
                message.error(response);
                return;
            }

            message.success("Company created successfully");

            // Reset the form
            handleReset();
        } catch (error) {
            console.error("Error creating company:", error);
            message.error("Failed to create company");
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
                    label="Company Name"
                    rules={[
                        { required: true, message: "Please enter Company Name" },
                    ]}
                >
                    <Input placeholder="Enter Company Name" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea 
                        placeholder="Enter Company Description (optional)" 
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
                            Create Company
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default CompanyForm;

