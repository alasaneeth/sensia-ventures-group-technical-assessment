import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class Country extends Model {}

Country.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        country: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // companyId removed; company is derived via brand.company
        brandId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "brands",
                key: "id",
            },
        },
    },
    {
        hooks: {
            beforeCreate(country) {
                country.country = country.country.toLowerCase().trim();
            },
        },
        sequelize,
        timestamps: false,
        modelName: "countries",
        indexes: [
            {
                unique: true,
                fields: ["country", "brandId"],
            },
        ],
    }
);

export default Country;
