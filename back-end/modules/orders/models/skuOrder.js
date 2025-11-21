import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Order from "./order.js";
import BundleSku from "../../products/models/bundleSku.js";

class SkuOrder extends Model {}

SkuOrder.init(
    {
        orderId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Order,
                key: "id",
            },
        },
        bundleSkuId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: BundleSku,
                key: "id",
            },
        },
    },
    {
        sequelize: sequelize,
        tableName: "sku_orders",
        timestamps: false,
        freezeTableName: true,
    }
);

export default SkuOrder;
