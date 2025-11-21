import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
class Address extends Model {}

Address.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true
        },
        country: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "Country associated with this address",
        },

        status: {
            type: DataTypes.STRING,
            defaultValue: "normal",
        },

        comment: {
            type: DataTypes.STRING,
        },

        poBoxNumber: {
            type: DataTypes.STRING,
        },
        ManagerAtBluescale: {
            type: DataTypes.STRING,
        },
        openingDate: {
            type: DataTypes.DATEONLY,
        },
        teamNameContact: {
            type: DataTypes.STRING,
        },
        poBoxEmail: {
            type: DataTypes.STRING,
            validate: {
                isEmail: true,
            },
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
                records.forEach((_, i) =>
                    records[i].country.trim().toLowerCase()
                );
            },
            beforeCreate(record) {
                if (record.country) {
                    record.country = record.country.trim().toLowerCase();
                }
            },
        },
        sequelize,
        timestamps: false,
        tableName: "addresses",
        modelName: "Address",
        indexes: [
            {
                unique: true,
                fields: ["address", "brandId"],
            },
        ],
    }
);

export default Address;
