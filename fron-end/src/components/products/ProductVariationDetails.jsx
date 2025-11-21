import React from "react";
import { Table, Empty, Tag } from "antd";

function ProductVariationDetails({ productVariation }) {
    if (!productVariation) {
        return (
            <div style={{ marginTop: "0.5rem" }}>
                <Empty
                    description="Select a product variation to see details"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        );
    }

    const product = productVariation.product || {};
    const categories = product.categories || [];

    const columns = [
        // Product fields
        {
            title: "Product Name",
            dataIndex: "product_name",
            key: "product_name",
            width: 250,
            render: () => product.name || "",
        },
        {
            title: "Product Code",
            dataIndex: "product_code",
            key: "product_code",
            width: 250,
            render: () => product.code || "",
        },
        {
            title: "Product Internal Code",
            dataIndex: "internal_code",
            key: "internal_code",
            width: 250,
            render: () => product.internalCode ?? "",
        },
        {
            title: "Product Representation",
            dataIndex: "representation",
            key: "representation",
            width: 250,
            render: () => product.representation || "",
        },
        {
            title: "Categories",
            dataIndex: "categories",
            key: "categories",
            width: 250,
            render: () =>
                categories.length > 0
                    ? categories.map((cat) => cat.name).join(", ")
                    : "",
        },
        // Product variation fields
        {
            title: "Variation Name",
            dataIndex: "variation_name",
            key: "variation_name",
            width: 250,
            render: () => productVariation.name || "",
        },
        {
            title: "Variation Code",
            dataIndex: "variation_code",
            key: "variation_code",
            width: 250,
            render: () => productVariation.code || "",
        },
        {
            title: "Variation",
            dataIndex: "variation",
            key: "variation",
            width: 250,
            render: () => productVariation.variation || "",
        },
        {
            title: "Variation Program Time",
            dataIndex: "program_time",
            key: "program_time",
            width: 250,
            render: () => productVariation.programTime || "",
        },
        {
            title: "Variation Posology",
            dataIndex: "posology",
            key: "posology",
            width: 250,
            render: () => productVariation.posology || "",
        },
        {
            title: "Variation Description",
            dataIndex: "description",
            key: "description",
            width: 250,
            render: () => productVariation.description || "",
        },
        {
            title: "Variation Price/Item",
            dataIndex: "price",
            key: "price",
            width: 400,
            render: () =>
                productVariation.pricingPerItem
                    ? `${productVariation.pricingPerItem} ${
                          productVariation.currency || ""
                      }`
                    : "",
        },
        {
            title: "Variation UPC Code",
            dataIndex: "upc_code",
            key: "upc_code",
            width: 250,
            render: () => productVariation.upcCode || "",
        },
        {
            title: "Variation Lab Status",
            dataIndex: "formula",
            key: "formula",
            width: 250,
            render: () =>
                productVariation.formulaProductVariationFromLaboratory || "",
        },
        {
            title: "Variation Supplement Facts",
            dataIndex: "supplement_facts",
            key: "supplement_facts",
            width: 250,
            render: () => productVariation.supplementFacts || "",
        },
        {
            title: "Variation Instructions",
            dataIndex: "instructions",
            key: "instructions",
            width: 250,
            render: () => productVariation.instructions || "",
        },
        {
            title: "Variation Manufactured Description",
            dataIndex: "manufactured",
            key: "manufactured",
            width: 250,
            render: () => productVariation.manufacturedDescription || "",
        },
        {
            title: "Variation Front Claims",
            dataIndex: "front_claims",
            key: "front_claims",
            width: 250,
            render: () => productVariation.frontClaims || "",
        },
        {
            title: "Variation FDA Statements",
            dataIndex: "fda_statements",
            key: "fda_statements",
            width: 250,
            render: () => productVariation.fdaStatements || "",
        },
    ];

    const data = [{ key: "1" }];

    return (
        <div style={{ marginTop: "0.5rem" }}>
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                size="small"
                bordered
                scroll={{ x: 4000 }}
                style={{ width: "100%" }}
            />
        </div>
    );
}

export default ProductVariationDetails;
