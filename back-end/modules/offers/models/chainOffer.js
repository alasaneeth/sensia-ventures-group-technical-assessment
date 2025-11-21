import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class ChainOffer extends Model {};

// This model for easier queries. this is just a container that contains the offers
// in the selected chains and keep the order. in case you want to know more information
// You need to see OfferSequences.js that model is responsible of knowing exact transition
// Between offers. so if you only care about the order join with this. you want to know
// What is the dependency between offers, activation days, etc you need to join with OfferSequences.js
ChainOffer.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    offerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: "offers",
            key: "id"
        }
    },
    chainId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: "chains",
            key: "id"
        }
    },
    index: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize,
    timestamps: false,
    modelName: "chain_offers",
    indexes: [
        {
            unique: true,
            fields: ["chainId", "offerId"]
        }
    ]
});

export default ChainOffer;