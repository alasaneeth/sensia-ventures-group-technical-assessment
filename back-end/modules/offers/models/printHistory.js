import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import { sharedAttributes } from "../../clients/models/client.js";

class PrintHistory extends Model {}

// Instead of storing CSV files it will be messy to deal with. So just copy them here
// The exportation history like the file metadata and this is the content on that file

PrintHistory.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        // This will point to history ExportationHistory
        historyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "exportation_history",
                key: "id",
            },
        },
        // This is clientOffer code which is for data entry
        dataEntryCode: {
            type: DataTypes.STRING,
        },
        mailDate: {
            type: DataTypes.DATEONLY,
        },
        clientId: {
            type: DataTypes.BIGINT,
        },

        ...sharedAttributes,

        campaignCode: {
            // Just to know the code
            type: DataTypes.STRING,
        },
    },
    {
        sequelize,
        timestamps: false,
        tableName: "print_history",
    }
);

export default PrintHistory;
