import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Invoice from "./invoice.js";
import User from "../../auth/models/user.js";

class Payment extends Model {}

Payment.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
        },
        // Maybe can relate them in the future
        partner: {
            type: DataTypes.STRING,
            // references: {
            //     model: Invoice,
            //     key: "partner"
            // }
        },
        // This will hold only the symbol of the currency
        currency: {
            type: DataTypes.STRING,
        },
        createdAt: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        confirmedById: {
            type: DataTypes.BIGINT,
            references: {
                model: User,
                key: "id",
            },
            allowNull: true,
            onDelete: "SET NULL",
        },
        confirmedAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
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
            },
            beforeUpdate(row) {
                console.log(row);
                if (row.confirmedById) {
                    row.confirmedAt = new Date();
                }
            },
            beforeBulkUpdate(options) {
                console.log(options);
                if (options.attributes?.confirmedById) {
                    options.attributes.confirmedAt = new Date();
                    options.fields.push('confirmedAt');
                }
            },
        },
        timestamps: false,
        modelName: "payments",
        sequelize,
    }
);

export default Payment;
