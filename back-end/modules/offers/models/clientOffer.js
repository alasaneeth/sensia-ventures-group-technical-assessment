import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import OfferSequence from "./offerSequence.js";

class ClientOffer extends Model {}

// The core data structure for grouping everything in the system together. be carefull when edit it in the future
ClientOffer.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        campaignId: {
            type: DataTypes.BIGINT,
            allowNull: true, // For now they both can be null
            references: {
                model: "campaigns",
                key: "id",
            },
        },
        chainId: {
            type: DataTypes.BIGINT,
            allowNull: true, // Even here, but only one must be provided either the chain or the campaign
            references: {
                model: "chains",
                key: "id",
            },
        },
        // When update the client table, be sure to update the client_offers table
        clientId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "clients",
                key: "id",
            },
        },
        // This will leadus to the key code we came from
        keyCodeId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "key_code_details",
                key: "id",
            },
        },

        currentSequenceId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "offer_sequences",
                key: "id",
            },
        },
        availableAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        // TODO: add a btree index here
        // Note this will be add by a trigger. see addTriggers function in sequelize.js
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true, // Open it when you re-create the database
        },
        // To know if this generated another offer from the chain
        isActivated: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        // To know how many offers we need to export
        isExported: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        // To know if this offer to place order of or
        // Take it from another offer
        originalOfferId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "client_offers",
                key: "id",
            },
        },
        // companyId removed; company is derived via brand.company
        brandId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "brands",
                key: "id",
            },
        },
    },
    {
        sequelize,
        modelName: "ClientOffer",
        tableName: "client_offers",
        timestamps: true,
    }
);

export default ClientOffer;
