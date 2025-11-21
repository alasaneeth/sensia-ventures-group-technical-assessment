import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Address from "./address.js";

class Shipment extends Model {}

Shipment.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        poBoxId: {
            type: DataTypes.INTEGER,
            references: {
                model: Address,
                key: "id",
            },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        deliveryCourrier: {
            type: DataTypes.STRING,
        },
        trackingNumber: {
            type: DataTypes.STRING,
        },
        numberOfLetters: {
            type: DataTypes.BIGINT,
        },
        weight: {
            type: DataTypes.STRING,
        },
        receivingDate: {
            type: DataTypes.DATEONLY,
        },
        received: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        brandId: {
            type: DataTypes.BIGINT,
            allowNull: true, // Allow null initially, will be required in future
            references: {
                model: "brands",
                key: "id",
            },
        },
        dataEntryFinishedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "shipments",
        timestamps: true,
        modelName: "Shipment",
    }
);

export default Shipment;
