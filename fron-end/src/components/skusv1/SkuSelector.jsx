import React, { useState, useEffect } from "react";
import { Modal, Table, Input, Button, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getProductSkus } from "../../api/productSku";

function SkuSelector({ visible, onCancel, onSelect, excludeIds = [] }) {
    const [skus, setSkus] = useState([]);
    const [filteredSkus, setFilteredSkus] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (visible) {
            fetchSkus();
        }
    }, [visible]);

    useEffect(() => {
        // Filter SKUs based on search text
        if (searchText) {
            const filtered = skus.filter(
                (sku) =>
                    sku.skuCode?.toLowerCase().includes(searchText.toLowerCase()) ||
                    sku.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                    sku.productVariation?.productVariationCode
                        ?.toLowerCase()
                        .includes(searchText.toLowerCase())
            );
            setFilteredSkus(filtered);
        } else {
            setFilteredSkus(skus);
        }
    }, [searchText, skus]);

    const fetchSkus = async () => {
        setLoading(true);
        try {
            const result = await getProductSkus(1, 100); // Fetch first 100
            const dataToSet = result?.data || [];
            // Filter out excluded SKUs
            const filtered = dataToSet.filter(
                (sku) => !excludeIds.includes(sku.id)
            );
            setSkus(filtered);
            setFilteredSkus(filtered);
        } catch (error) {
            console.error("Failed to load SKUs:", error);
            message.error("Failed to load SKUs");
            setSkus([]);
            setFilteredSkus([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOk = () => {
        const selectedSkus = skus.filter((sku) =>
            selectedRowKeys.includes(sku.id)
        );
        if (selectedSkus.length === 0) {
            message.warning("Please select at least one SKU");
            return;
        }
        onSelect(selectedSkus);
        setSelectedRowKeys([]);
        setSearchText("");
    };

    const handleCancel = () => {
        setSelectedRowKeys([]);
        setSearchText("");
        onCancel();
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys);
        },
    };

    const columns = [
        {
            title: "SKU Code",
            dataIndex: "skuCode",
            key: "skuCode",
            width: 150,
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            width: 200,
        },
        {
            title: "Product Variation",
            dataIndex: ["productVariation", "productVariationCode"],
            key: "productVariation",
            width: 150,
            render: (text) => text || "N/A",
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            width: 100,
            render: (price) => (price ? `€${parseFloat(price).toFixed(2)}` : "N/A"),
        },
        {
            title: "Quantity",
            dataIndex: "qty",
            key: "qty",
            width: 80,
        },
    ];

    return (
        <Modal
            title="Select SKUs"
            open={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            width={900}
            okText="Add Selected SKUs"
            cancelText="Cancel"
        >
            <Input
                placeholder="Search by SKU code, title, or product variation"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
            />

            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={filteredSkus}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} SKUs`,
                }}
                size="small"
            />

            <div style={{ marginTop: 8 }}>
                Selected: <strong>{selectedRowKeys.length}</strong> SKU(s)
            </div>
        </Modal>
    );
}

export default SkuSelector;

