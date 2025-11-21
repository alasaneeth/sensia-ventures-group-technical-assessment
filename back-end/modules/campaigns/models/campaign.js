import { Model, DataTypes, DATE } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import { getWeek } from "date-fns";
import PayeeName from "../../settings/models/payeeName.js";

class Campaign extends Model {}

Campaign.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true
        },
        country: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // Here we will add another field to know which week in the year
        mailDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "Date when the mail should be sent",
        },
        weekOfYear: {
            type: DataTypes.VIRTUAL,
            get() {
                const date = this.getDataValue("mailDate");
                if (!date) return null;
                return getWeek(date); // returns week number of the year
            },
            set(value) {
                throw new Error("Do not try to set the `weekOfYear` value!");
            },
        },
        // printer moved to Offer model
        mailQuantity: {
            type: DataTypes.BIGINT,
            allowNull: true,
            comment: "Quantity of mail to be sent",
            defaultValue: 0,
        },
        chainId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "chains",
                key: "id",
            },
        },
        brandId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "brands",
                key: "id",
            },
        },
        // mainPoBoxId: {
        //     type: DataTypes.INTEGER,
        //     allowNull: true,
        //     references: {
        //         model: "addresses",
        //         key: "id",
        //     },
        //     comment: "Reference to the main PO Box address",
        // },
        // chainPoBoxId: {
        //     type: DataTypes.INTEGER,
        //     allowNull: true,
        //     references: {
        //         model: "addresses",
        //         key: "id",
        //     },
        //     comment: "Reference to the chain PO Box address",
        // },
        // // The structure of this field is cash,check or check or cash
        // paymentMethod: {
        //     type: DataTypes.STRING,
        //     allowNull: true,
        //     comment: "Payment method for the campaign",
        // },

        // To know if we extract the clients to it
        isExtracted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        // payeeNameId moved to Offer model
    },
    {
        hooks: {
            beforeBulkCreate(records) {
                records.forEach((_, i) =>
                    records[i].country.trim().toLowerCase()
                );
            },

            beforeCreate(record) {
                record.country = record.country.trim().toLowerCase();
            },
        },
        sequelize,
        tableName: "campaigns",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["code", "brandId"],
            },
        ],
    }
);

export default Campaign;
