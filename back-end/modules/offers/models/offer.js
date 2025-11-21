import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class Offer extends Model {}

Offer.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        //  code, just change it later
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            // THis must be unique
            // unique: true,
        },
        // Client service, no payement letter, offer
        type: {
            type: DataTypes.STRING,
            // allowNull: false,
        },
        // description of the offer (complaing or not recognized etc...)
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        porter: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        owner: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        theme: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        grade: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        language: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        origin: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING,
            // allowNull: false,
        },
        brandId: {
            type: DataTypes.BIGINT,
            references: {
                model: "brands",
                key: "id",
            },
        },
    },
    {
        hooks: {
            beforeCreate(offer) {
                offer.country = offer.country.toLowerCase();
                if (offer?.type?.includes(" ")) {
                    offer.type = offer.type.replace(" ", "-").toLowerCase();
                } else if (offer.type) {
                    offer.type = offer.type.toLowerCase();
                }
            },
            beforeBulkCreate(offers) {
                offers.forEach((_, i) => {
                    if (offers[i].country) {
                        offers[i].country = offers[i].country.toLowerCase();
                    }
                    if (offers[i].type?.includes(" ")) {
                        offers[i].type = offers[i].type
                            .replace(" ", "-")
                            .toLowerCase();
                    } else if (offers[i].type) {
                        offers[i].type = offers[i].type.toLowerCase();
                    }
                });
            },
        },
        sequelize,
        tableName: "offers",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["title", "brandId"],
            },
        ],
    }
);

export default Offer;
