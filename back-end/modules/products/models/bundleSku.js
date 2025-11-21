import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Brand from "../../companies/models/brand.js";

class BundleSku extends Model {}

BundleSku.init(
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
        brandId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Brand,
                key: "id",
            },
        },

        code: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "Unique bundle code/identifier",
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Description of the bundle",
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        discount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        priceToPay: {
            type: DataTypes.VIRTUAL(DataTypes.FLOAT),
            get() {
                const price = parseFloat(this.price || 0);
                const discount = parseFloat(this.discount || 0);
                return price - discount;
            },
        },
    },
    {
        sequelize,
        tableName: "bundle_skus",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["brandId", "code"],
                name: "product_bundle_skus_code_unique",
            },
        ],
        hooks: {
            beforeCreate(record) {
                if (record.code) record.code = record.code.trim();
                if (record.name) record.name = record.name.trim();
                if (record.description)
                    record.description = record.description.trim();
                if (record.currency) record.currency = record.currency.trim();
            },
            beforeUpdate(record) {
                if (record.code) record.code = record.code.trim();
                if (record.name) record.name = record.name.trim();
                if (record.description)
                    record.description = record.description.trim();
                if (record.currency) record.currency = record.currency.trim();
            },
        },
    }
);

export default BundleSku;
