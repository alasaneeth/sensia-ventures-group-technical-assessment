import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class KeyCode extends Model {}

// To know for example we selected a key code and wanna see what clients are using it
// we join with campaigns then join on client_offer and to know for example the clients
// then join with clients. if you want to know the overall money for this campaign
// you can join with orders and sum the amount. nested relations but sequelize can handle it

// M:N relation between campaign and the client. When exporting
KeyCode.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        keyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "key_code_details",
                key: "id",
            },
        },
        // This column and the next one must be composite unique constraint add them
        campaignId: {
            type: DataTypes.BIGINT,
            references: {
                model: "campaigns",
                key: "id",
            },
            // unique: true
        },
        // Add the offer id
        offerId: {
            type: DataTypes.BIGINT,
            references: {
                model: "offers",
                key: "id",
            },
        },
        clientId: {
            type: DataTypes.BIGINT,
            references: {
                model: "clients",
                key: "id",
            },
            // unique: true
        },
        isExtracted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        timestamps: false,
        modelName: "key_codes",
        indexes: [
            {
                unique: true,
                fields: ["keyId", "offerId", "campaignId", "clientId"],
                name: "key_id_offer_id_campaign_id_client_id_unique",
            },
        ],
    }
);

export default KeyCode;
