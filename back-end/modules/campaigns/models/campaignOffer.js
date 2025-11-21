import { DataTypes, Model } from "sequelize";
import PayeeName from "../../settings/models/payeeName.js";
import sequelize from "../../../config/sequelize.js";

class CampaignOffer extends Model {}

// The chain controls the transations between offers. While each offer can contains PO box different
// From the same offer in another campaign. same as fixed price and etc

CampaignOffer.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        campaignId: {
            type: DataTypes.BIGINT,
            references: {
                model: "campaigns",
                key: "id",
            },
        },
        offerId: {
            type: DataTypes.BIGINT,
            references: {
                model: "offers",
                key: "id",
            },
        },
        returnAddressId: {
            type: DataTypes.INTEGER,
            // allowNull: false,
            references: {
                model: "addresses",
                key: "id",
            },
        },
        payeeNameId: {
            type: DataTypes.INTEGER,
            references: {
                model: PayeeName,
                key: "id",
            },
            onDelete: "SET NULL",
        },
        printer: {
            type: DataTypes.STRING,
        },
        printingPrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        listPrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        physicalItemPrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        lettershopPrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        uniqueDPPrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        uniqueMiscPrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        postagePrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        purchasePrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        timestamps: false,
        tableName: "campaign_offers",
    }
);

export default CampaignOffer;
