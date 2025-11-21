import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Brand from "../../companies/models/brand.js";

class Product extends Model {}

Product.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
        },
        code: {
            type: DataTypes.STRING,
        },
        internalCode: {
            type: DataTypes.BIGINT,
        },
        // Real, Virtual
        representation: {
            type: DataTypes.STRING
        },
        brandId: {
            type: DataTypes.BIGINT,
            references: {
                model: Brand,
                key: "id"
            }
        }
    },
    {
        sequelize,
        tableName: "products",
        timestamps: true,
        hooks: {
            beforeCreate(record) {
                if (record.name) record.name = record.name.trim();
                if (record.code) record.code = record.code.trim();
                if (record.representation)
                    record.representation = record.representation.trim();
            },
            beforeBulkCreate(records) {
                records.map((record, i) => {
                    if (record.name) records[i].name = record.name.trim();
                    if (record.code) records[i].code = record.code.trim();
                    if (record.representation)
                        records[i].representation = record.representation.trim();
                });
            },
        },
        indexes: [
            {
                type: "UNIQUE",
                fields: ['brandId', 'code'],
                name: "products_brand_code"
            }
        ]
    }
);

export default Product;
