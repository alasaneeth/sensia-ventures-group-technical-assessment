import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class OfferSequence extends Model {}

OfferSequence.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        daysToAdd: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment:
                "Days to add to unlock the next sequence from the date of placing an order",
        },
        currentOfferId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "offers",
                key: "id",
            },
        },
        nextOfferId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "offers",
                key: "id",
            },
        },
        // That's fine for now
        // returnAddressId: {
        //     type: DataTypes.INTEGER,
        //     allowNull: true,
        //     references: {
        //         model: "addresses",
        //         key: "id",
        //     },
        // },
        chainId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "chains",
                key: "id",
            },
        },
        // campaignId: {
        //     type: DataTypes.BIGINT,
        //     allowNull: true,
        //     references: {
        //         model: "campaigns",
        //         key: "id",
        //     },
        // },
    },
    {
        sequelize,
        tableName: "offer_sequences",
        timestamps: true,
    }
);

export default OfferSequence;
