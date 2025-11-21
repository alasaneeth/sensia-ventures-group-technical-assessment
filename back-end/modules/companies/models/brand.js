import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Company from "./company.js";

class Brand extends Model {}

Brand.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        companyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: Company,
                key: "id",
            },
            onDelete: "SET NULL",
        },
    },
    {
        hooks: {
            beforeCreate(brand) {
                if (brand.name) {
                    brand.name = brand.name.trim();
                }
                if (brand.description) {
                    brand.description = brand.description.trim();
                }
            },
            beforeUpdate(brand) {
                if (brand.name) {
                    brand.name = brand.name.trim();
                }
                if (brand.description) {
                    brand.description = brand.description.trim();
                }
            },
        },
        sequelize,
        timestamps: true,
        createdAt: "createdAt",
        updatedAt: "updatedAt",
        tableName: "brands",
    }
);

export default Brand;
