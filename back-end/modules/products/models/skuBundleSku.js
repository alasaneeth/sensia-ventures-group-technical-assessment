import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import BundleSku from "./bundleSku.js";
import Brand from "../../companies/models/brand.js";

class SkuBundleSku extends Model {}

SkuBundleSku.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        bundleSkuId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: BundleSku,
                key: "id",
            },
        },
        skuId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "product_skus",
                key: "id",
            },
        },
    },
    {
        sequelize,
        tableName: "sku_bundle_skus",
        timestamps: true,
    }
);

export default SkuBundleSku;
