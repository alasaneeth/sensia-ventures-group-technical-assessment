// This model is pretty much like client offer. But instead this is the source of truth
// For the printer page. When the client do have the client offer for the first offer in the chain
// And palced an order for him twice. he will get one client offer of the next offer from the chain
// BUT the printer should print two times the second offer not once

import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Campaign from "../../campaigns/models/campaign.js";
import ClientOffer from "./clientOffer.js";

class OfferPrint extends Model {}

OfferPrint.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        clientId: {
            type: DataTypes.BIGINT,
            references: {
                model: "clients",
                key: "id",
            },
            onDelete: "SET NULL",
        },
        offerId: {
            type: DataTypes.BIGINT,
            references: {
                model: "offers",
                key: "id",
            },
            onDelete: "SET NULL",
        },
        campaignId: {
            type: DataTypes.BIGINT,
            references: {
                model: Campaign,
                key: "id",
            },
            onDelete: "SET NULL",
        },
        keyCodeId: {
            type: DataTypes.BIGINT,
            references: {
                model: "key_code_details",
                key: "id",
            },
        },
        // The same as mail at (mail date)
        availableAt: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        offerCode: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: ClientOffer,
                key: "code",
            },
            onDelete: "SET NULL",
        },
        isExported: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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
        sequelize,
        modelName: "offerPrint",
        tableName: "offer_prints",
        timestamps: true,
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    }
);

export default OfferPrint;
