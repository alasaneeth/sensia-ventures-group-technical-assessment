import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class PaymentMethod extends Model {}

PaymentMethod.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        country: {
            type: DataTypes.STRING,
            // unique: true,
        },
        // Array of payment methods available for the country (e.g., ['cash', 'check', 'postal'])
        paymentMethod: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: ["cash"],
            comment: "Array of payment methods available for the country",
        },
        brandId: {
            type: DataTypes.BIGINT,
            references: {
                model: "brands",
                key: "id",
            },
        },
    },
    {
        hooks: {
            beforeBulkCreate(records) {
                records.forEach((_, i) => {
                    records[i].country = records[i]?.country?.toLowerCase();
                });
            },
            beforeCreate(record) {
                record.country = record?.country?.toLowerCase()
            }
        },
        sequelize,
        timestamps: false,
        tableName: "payment_methods",
        indexes: [
            {
                unique: true,
                fields: ["country", "brandId"],
            },
        ],
    }
);

export default PaymentMethod;
