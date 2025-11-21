import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import BundleSku from "../../products/models/bundleSku.js";
import Offer from "./offer.js";

class SkuOffer extends Model {}

// This to link the SKUs to the offers (of type offer only)
SkuOffer.init(
    {
        bundleSkuId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            references: {
                model: BundleSku,
                key: "id",
            },
        },
        offerId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            references: {
                model: Offer,
                key: "id",
            },
        },
    },
    {
        sequelize,
        tableName: "sku_offers",
        timestamps: false,
    }
);

export default SkuOffer;
