import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";

class Client extends Model {}

const sharedAttributes = {
    gender: {
        type: DataTypes.STRING,
        defaultValue: "not sure"
    },
    firstName: {
        type: DataTypes.STRING,
    },
    lastName: {
        type: DataTypes.STRING,
    },
    country: {
        type: DataTypes.STRING,
    },
    city: {
        type: DataTypes.STRING,
    },
    state: {
        type: DataTypes.STRING,
    },
    zipCode: {
        // or postal
        type: DataTypes.STRING,
    },
    address1: {
        type: DataTypes.STRING,
    },
    address2: {
        type: DataTypes.STRING,
    },
    address3: {
        type: DataTypes.STRING,
    },
    birthDate: {
        type: DataTypes.DATEONLY,
    },
    phone: {
        type: DataTypes.STRING,
    },
};

// When update any columns here. make sure you do for client_offer.js
Client.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },

        isBlacklisted: {
            ////// Whether the user blocklisted or not
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        /// To know from which file got imported
        importedFrom: {
            type: DataTypes.STRING,
            defaultValue: "manual",
        },

        // This must be derived but for now there is an old data. make sure to keep this in sync with placing order
        lastPurchaseDate: {
            type: DataTypes.DATEONLY,
        },
        totalAmount: {
            // How many he paid through all orders
            type: DataTypes.DECIMAL(20, 2),
            defaultValue: 0,
        },
        totalOrders: {
            // How many orders he has
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        totalMails: {
            // How many mails he received
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        listOwner: {
            type: DataTypes.STRING,
        },
        brandId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "brands",
                key: "id",
            },
        },
        // Destructure the shared attributes
        ...sharedAttributes,

        //
    },
    {
        hooks: {
            beforeBulkCreate(data) {
                data.forEach((_, i) => {
                    if (data[i].country) {
                        data[i].country = data[i].country.toLowerCase().trim();
                    }
                    if (data[i].gender) {
                        data[i].gender = data[i].gender.toLowerCase().trim();
                    } else {
                        data[i].gender = "not sure";
                    }
                });
            },
            beforeCreate(item) {
                if (item.country) {
                    item.country = item.country.toLowerCase().trim();
                }

                if (item.gender) {
                    item.gender = item.gender.toLowerCase().trim();
                } else {
                    item.gender = "not sure";
                }
            },
        },
        sequelize,
        modelName: "Client",
        tableName: "clients",
        timestamps: true,
    }
);

export default Client;

export { sharedAttributes };
