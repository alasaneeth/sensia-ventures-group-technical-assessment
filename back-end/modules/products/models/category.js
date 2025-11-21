import { DataTypes, Model } from "sequelize";
import Brand from "../../companies/models/brand.js";
import sequelize from "../../../config/sequelize.js";

class Category extends Model {}


Category.init({
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    brandId: {
        type: DataTypes.BIGINT,
        references: {
            model: Brand,
            key: "id"
        }
    }
}, {
    timestamps: true,
    sequelize,
    indexes: [
        {
            type: "UNIQUE",
            fields: ["brandId", "name"],
            name: "category_brand_name"
        }
    ],
    tableName: "categories"
})

export default Category