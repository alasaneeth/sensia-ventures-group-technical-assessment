import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class KeyCodeDetails extends Model {}

// Stores metadata about key codes (description and filters)
// Linked to key_codes via the key field (not id)
KeyCodeDetails.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true,
        },
        campaignId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "campaigns",
                key: "id",
            },
        },
        // Add offer to the relation
        offerId: {
            type: DataTypes.BIGINT,
            references: {
                model: "offers",
                key: "id",
            },
        },
        listName: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        filters: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        isUnknown: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        // There is no way to know where is the segment come from at run time. specially when the offer open two offers and make mails for them
        // We can't query by offer id and campaign id with listname because we have many segments for the same offers and campaign and listname
        // The different is only on the filters and relying on filters for checking is performance hurt issue. So balance between storage and time is necessary here
        fromSegmentId: {
            type: DataTypes.BIGINT,
            references: {
                model: KeyCodeDetails,
                key: "id",
            },
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
        timestamps: true,
        tableName: "key_code_details",
    }
);

export default KeyCodeDetails;
