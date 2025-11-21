// This model to link the SKUs with the offers of type product.
// That depeneds on the orders NOT on the offers.
// This is only for the PRINTER so when he get an offer of type product
// like JP_AVL_PRODMM for the client X then he sees the SKUs of that order something like this skus: sku1, sku2

import { DataTypes, Model } from "sequelize";
import OfferPrint from "./offerPrint.js";
import BundleSku from "../../products/models/bundleSku.js";
import sequelize from "../../../config/sequelize.js";


class PrinterSkus extends Model {};

PrinterSkus.init({
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    printerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: OfferPrint,
            key: 'id'
        }
    },
    skuId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: BundleSku,
            key: 'id'
        }
    }
}, {
    sequelize,
    timestamps: false,
    tableName: 'printer_skus'
})