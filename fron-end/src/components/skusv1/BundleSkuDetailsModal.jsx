import React from "react";
import { Modal, Descriptions, Tag, Divider, Table } from "antd";

function BundleSkuDetailsModal({ visible, bundleSku, onClose }) {
    if (!bundleSku) return null;

    const skuColumns = [
        {
            title: "SKU Code",
            dataIndex: "skuCode",
            key: "skuCode",
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Quantity in Bundle",
            dataIndex: ["BundleSkuItem", "quantity"],
            key: "quantity",
            render: (text) => text || 1,
        },
        {
            title: "Sort Order",
            dataIndex: ["BundleSkuItem", "sortOrder"],
            key: "sortOrder",
            render: (text) => text || "N/A",
        },
    ];

    return (
        <Modal
            title={`Bundle SKU Details: ${bundleSku.bundleCode || bundleSku.bundleName}`}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
        >
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="ID">{bundleSku.id}</Descriptions.Item>
                <Descriptions.Item label="Bundle Code">
                    {bundleSku.bundleCode || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Bundle Name" span={2}>
                    {bundleSku.bundleName || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Client">
                    {bundleSku.client || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                    {bundleSku.category || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Active">
                    <Tag color={bundleSku.active ? "green" : "red"}>
                        {bundleSku.active ? "Yes" : "No"}
                    </Tag>
                </Descriptions.Item>
            </Descriptions>

            <Divider>Pricing</Divider>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Total Price">
                    {bundleSku.totalPrice
                        ? `€${parseFloat(bundleSku.totalPrice).toFixed(2)}`
                        : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Currency">
                    {bundleSku.currency || "EUR"}
                </Descriptions.Item>
                <Descriptions.Item label="Discount">
                    {bundleSku.discount
                        ? `€${parseFloat(bundleSku.discount).toFixed(2)}`
                        : "€0.00"}
                </Descriptions.Item>
            </Descriptions>

            <Divider>SKUs in Bundle ({bundleSku.skus?.length || 0})</Divider>
            <Table
                columns={skuColumns}
                dataSource={bundleSku.skus || []}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{ emptyText: "No SKUs in this bundle" }}
            />

            <Divider>Additional Information</Divider>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Description" span={2}>
                    {bundleSku.description || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Notes" span={2}>
                    {bundleSku.notes || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                    {bundleSku.createdAt
                        ? new Date(bundleSku.createdAt).toLocaleString()
                        : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                    {bundleSku.updatedAt
                        ? new Date(bundleSku.updatedAt).toLocaleString()
                        : "N/A"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
}

export default BundleSkuDetailsModal;

