import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class Invoice extends Model {}

Invoice.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        partner: {
            type: DataTypes.STRING,
        },
        subject: {
            type: DataTypes.STRING,
        },
        code: {
            type: DataTypes.STRING,
            // unique: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
        },
        currency: {
            type: DataTypes.STRING,
        },
        createdAt: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
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
            beforeBulkCreate(rows) {
                rows.forEach((row, i) => {
                    if (rows[i].partner) {
                        rows[i].partner = row.partner.trim().toLowerCase();
                    }
                });
            },
            beforeCreate(row) {
                if (row.partner) {
                    row.partner = row.partner.trim().toLowerCase();
                }
            }
        },
        timestamps: true,
        sequelize,
        modelName: "invoices",
        indexes: [
            {
                unique: true,
                fields: ["code", "brandId"],
            },
        ],
    }
);

export default Invoice;
