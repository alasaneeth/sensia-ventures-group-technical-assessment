import React from 'react';
import { Modal, Select, InputNumber, Button, Form, message } from 'antd';

const { Option } = Select;

const DependencyForm = ({ 
    visible, 
    onClose, 
    selectedNode, 
    chainData, 
    onConnect, 
    onEdgeDelete 
}) => {
    const [form] = Form.useForm();

    // Handle modal form submission
    function handleModalSubmit() {
        form.validateFields().then(values => {
            const { dependencies = [] } = values;
            
            // Remove existing connections for this node
            if (onEdgeDelete && selectedNode) {
                const existingConnections = chainData.offers[selectedNode.offerId]?.connections || [];
                existingConnections.forEach(conn => {
                    onEdgeDelete({
                        sourceId: selectedNode.offerId,
                        targetId: conn.offerId
                    });
                });
            }
            
            // Add new connections
            if (onConnect && selectedNode) {
                dependencies.forEach(dep => {
                    if (dep.targetId) {
                        onConnect({
                            sourceId: selectedNode.offerId,
                            targetId: dep.targetId,
                            daysToAdd: dep.daysToAdd || 0
                        });
                    }
                });
            }
            
            onClose();
            form.resetFields();
            message.success('Dependencies updated successfully');
        }).catch(err => {
            console.error('Form validation failed:', err);
        });
    }

    // Get available target nodes (excluding the selected node)
    function getAvailableTargets() {
        if (!selectedNode || !chainData.offers) return [];
        
        return Object.keys(chainData.offers)
            .filter(offerId => offerId !== selectedNode.offerId)
            .map(offerId => ({
                id: offerId,
                title: chainData.offers[offerId].title || `Offer ${offerId}`
            }));
    }

    // Pre-populate form when modal opens
    React.useEffect(() => {
        if (visible && selectedNode) {
            const currentConnections = chainData.offers[selectedNode.offerId]?.connections || [];
            form.setFieldsValue({
                dependencies: currentConnections.map(conn => ({
                    targetId: conn.offerId,
                    daysToAdd: conn.daysToAdd
                }))
            });
        }
    }, [visible, selectedNode, chainData, form]);

    return (
        <Modal
            title={`Configure Dependencies for ${selectedNode?.title || 'Offer'}`}
            open={visible}
            onOk={handleModalSubmit}
            onCancel={() => {
                onClose();
                form.resetFields();
            }}
            width={600}
            okText="Update Dependencies"
            cancelText="Cancel"
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ dependencies: [] }}
            >
                <Form.List name="dependencies">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <div key={key} className="d-flex align-items-end gap-3 mb-3">
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'targetId']}
                                        label="Target Offer"
                                        className="flex-grow-1"
                                        rules={[{ required: true, message: 'Please select a target offer' }]}
                                    >
                                        <Select placeholder="Select target offer">
                                            {getAvailableTargets().map(target => (
                                                <Option key={target.id} value={target.id}>
                                                    {target.title}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'daysToAdd']}
                                        label="Days to Add"
                                        style={{ width: '120px' }}
                                    >
                                        <InputNumber
                                            min={0}
                                            placeholder="0"
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                    
                                    <Button 
                                        type="text" 
                                        danger 
                                        onClick={() => remove(name)}
                                        style={{ marginBottom: '24px' }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            
                            <Form.Item>
                                <Button 
                                    type="dashed" 
                                    onClick={() => add()} 
                                    block
                                    disabled={getAvailableTargets().length === 0}
                                >
                                    Add Dependency
                                </Button>
                                {getAvailableTargets().length === 0 && (
                                    <div className="text-muted mt-2">
                                        No other offers available to connect to
                                    </div>
                                )}
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    );
};

export default DependencyForm;
