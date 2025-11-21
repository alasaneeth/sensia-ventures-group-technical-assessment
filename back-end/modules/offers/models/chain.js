import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Address from "../../campaigns/models/address.js";

class Chain extends Model {}

Chain.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true,
        },
        // The first sequence
        offerSequenceId: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        // companyId removed; company is derived via brand.company
        brandId: {
            type: DataTypes.BIGINT,
            references: {
                model: "brands",
                key: "id",
            },
        },
    },
    {
        sequelize,
        modelName: "Chain",
        tableName: "chains",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["title", "brandId"],
            },
        ],
    }
);

export default Chain;
