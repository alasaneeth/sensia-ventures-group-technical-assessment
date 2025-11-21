import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class Company extends Model {}

Company.init(
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
    },
    {
        hooks: {
            beforeCreate(company) {
                if (company.name) {
                    company.name = company.name.trim();
                }
                if (company.description) {
                    company.description = company.description.trim();
                }
            },
            beforeUpdate(company) {
                if (company.name) {
                    company.name = company.name.trim();
                }
                if (company.description) {
                    company.description = company.description.trim();
                }
            },
        },
        sequelize,
        timestamps: true,
        createdAt: "createdAt",
        updatedAt: "updatedAt",
        tableName: "companies",
    }
);

export default Company;
