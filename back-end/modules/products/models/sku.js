import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Brand from "../../companies/models/brand.js";
import ProductVariation from "./productVariation.js";

class Sku extends Model {}

Sku.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        code: {
            type: DataTypes.STRING,
        },

        brandId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Brand,
                key: "id",
            },
        },
        // Like a comment
        upsell: {
            type: DataTypes.STRING,
        },
        productVariationId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: ProductVariation,
                key: "id",
            },
        },
        quantity: {
            type: DataTypes.INTEGER,

            defaultValue: 1,
        },

        // Quantity details (e.g., '5 +3 free')
        qtyDetail: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING(600),
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),

            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING,
        },
        discount: {
            type: DataTypes.DECIMAL(10, 2),

            defaultValue: 0,
        },
        rule: {
            type: DataTypes.STRING,
        },

        // Virtual fields
        priceToPay: {
            type: DataTypes.VIRTUAL(DataTypes.FLOAT),
            get() {
                return this.price - this.discount;
            },
        },
    },
    {
        sequelize,
        tableName: "skus",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["brandId", "code"],
                name: "product_skus_code_unique",
            },
        ],
        hooks: {
            beforeCreate(record) {
                if (record.code) record.code = record.code.trim();
                if (record.name) record.name = record.name.trim();
                if (record.upsell) record.upsell = record.upsell.trim();
                if (record.qtyDetail)
                    record.qtyDetail = record.qtyDetail.trim();
                if (record.description)
                    record.description = record.description.trim();
                if (record.currency) record.currency = record.currency.trim();
                if (record.rule) record.rule = record.rule.trim();
            },
            beforeUpdate(record) {
                if (record.code) record.code = record.code.trim();
                if (record.name) record.name = record.name.trim();
                if (record.upsell) record.upsell = record.upsell.trim();
                if (record.qtyDetail)
                    record.qtyDetail = record.qtyDetail.trim();
                if (record.description)
                    record.description = record.description.trim();
                if (record.currency) record.currency = record.currency.trim();
                if (record.rule) record.rule = record.rule.trim();
            },
        },
    }
);

export default Sku;
