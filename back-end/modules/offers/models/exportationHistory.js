import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";

// This is the group of printed clients. alone will not have any meaning. but from it you can get all the
// Printed records to it
class ExportationHistory extends Model {}

ExportationHistory.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        exportedAt: {
            type: DataTypes.DATE,
        },
        offerId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "offers",
                key: "id",
            },
        },
        // This will not change in the future so save time by storing the value here. instead of join
        // To get the count
        quantity: {
            type: DataTypes.BIGINT,
        },
        skippedQuantity: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
        },
        // This information is the same for all file rows so keep it here instead of copying it
        // On all rows that will waste more disk memory
        offer: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        payeeName: {
            type: DataTypes.STRING,
        },
        returnAddress: {
            type: DataTypes.STRING,
        },
        // Supposed to be the filename
        fileName: {
            type: DataTypes.STRING,
        },
        // Just a mirror. print time
        availableDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        // If the file was printed for past records the maildate inside each record is different
        isPast: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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
        tableName: "exportation_history",
        timestamps: false,
    }
);

export default ExportationHistory;
