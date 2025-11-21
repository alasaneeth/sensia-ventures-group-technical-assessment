import React from "react";
import { Modal, Descriptions, Tag, Divider } from "antd";

function SkuDetailsModal({ visible, sku, onClose }) {
    if (!sku) return null;

    return (
        <Modal
            title={`SKU Details: ${sku.skuCode || sku.title}`}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
        >
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="ID">{sku.id}</Descriptions.Item>
                <Descriptions.Item label="SKU Code">
                    {sku.skuCode || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Title" span={2}>
                    {sku.title || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Client">
                    {sku.client || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                    {sku.category || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Active">
                    <Tag color={sku.active ? "green" : "red"}>
                        {sku.active ? "Yes" : "No"}
                    </Tag>
                </Descriptions.Item>
            </Descriptions>

            <Divider>Product Association</Divider>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Product Variation Code">
                    {sku.productVariation?.productVariationCode || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Quantity">
                    {sku.qty || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Quantity Detail" span={2}>
                    {sku.qtyDetail || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Product Variation Description" span={2}>
                    {sku.productVariation?.productVariationDescription || "N/A"}
                </Descriptions.Item>
            </Descriptions>

            <Divider>Pricing & Marketing</Divider>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Price">
                    {sku.price ? `€${parseFloat(sku.price).toFixed(2)}` : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Currency">
                    {sku.currency || "EUR"}
                </Descriptions.Item>
                <Descriptions.Item label="Discount">
                    {sku.discount ? `€${parseFloat(sku.discount).toFixed(2)}` : "€0.00"}
                </Descriptions.Item>
                <Descriptions.Item label="Upsell">
                    {sku.upsell || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Bundle SKU ID">
                    {sku.bundleSkuId || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Dependent SKU ID">
                    {sku.dependentSkuId || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Rule" span={2}>
                    {sku.rule || "N/A"}
                </Descriptions.Item>
            </Descriptions>

            <Divider>Additional Information</Divider>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Offer Code">
                    {sku.offerCode || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Avg Qty Per Order">
                    {sku.averageQtyPerOrder || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Gifts or Parcel Insert">
                    {sku.giftsOrParcelInsert || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Colonne1">
                    {sku.colonne1 || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Produit Réel dans Prostock" span={2}>
                    {sku.produitReelDansProstock || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Comments if Gift Visible" span={2}>
                    {sku.commentsIfGiftVisible || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                    {sku.description || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Date">
                    {sku.date
                        ? new Date(sku.date).toLocaleDateString()
                        : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                    {sku.createdAt
                        ? new Date(sku.createdAt).toLocaleString()
                        : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At" span={2}>
                    {sku.updatedAt
                        ? new Date(sku.updatedAt).toLocaleString()
                        : "N/A"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
}

export default SkuDetailsModal;

