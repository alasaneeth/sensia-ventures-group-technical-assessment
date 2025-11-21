import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class ClientsImportHistory extends Model {}

ClientsImportHistory.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
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
        sequelize: sequelize,
        tableName: "clients_import_history",
        timestamps: true,
    }
);

export default ClientsImportHistory;
