import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Category from "./category.js";
import Product from "./product.js";

class ProductCategory extends Model {}

ProductCategory.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        productId: {
            type: DataTypes.BIGINT,
            references: {
                model: Product,
                key: "id",
            },
        },
        categoryId: {
            type: DataTypes.BIGINT,
            references: {
                model: Category,
                key: "id",
            },
        },
    },
    {
        timestamps: true,
        sequelize,
        tableName: "products_categories",
    }
);

export default ProductCategory;
