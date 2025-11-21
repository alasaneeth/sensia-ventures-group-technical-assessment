import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import ClientOffer from "../../offers/models/clientOffer.js";
import Client, { sharedAttributes } from "../../clients/models/client.js";
import Address from "../../campaigns/models/address.js";
import Chain from "../../offers/models/chain.js";

class Order extends Model {}

// In the future get the fields from a shared object between this model and the client model
Order.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },

        // When update the client table, be sure to update the client_offers table
        clientId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "clients",
                key: "id",
            },
            onDelete: "SET NULL",
        },

        // Get the shared client detials
        ...sharedAttributes,

        sku: {
            type: DataTypes.BIGINT,
            references: {
                model: "skus",
                key: "id",
            },
        },

        // Campaign and offer details with the chain also
        clientOfferId: {
            // To know inormation about the campaign and chain, can be replaced
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: ClientOffer,
                key: "id",
            },
            onDelete: "SET NULL",
        },
        campaignId: {
            type: DataTypes.BIGINT,
            allowNull: true, // For now, in the future this can be not null
            references: {
                model: "campaigns",
                key: "id",
            },
            onDelete: "SET NULL",
        },
        offerId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "offers",
                key: "id",
            },
            onDelete: "SET NULL",
        },
        chainId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: Chain,
                key: "id",
            },
        },

        campaignCode: {
            type: DataTypes.STRING,
        },
        campaignTitle: {
            type: DataTypes.STRING,
        },
        chainTitle: {
            type: DataTypes.STRING,
        },
        offerTitle: {
            type: DataTypes.STRING,
        },

        // Order data
        // The required amount to pay
        amount: {
            type: DataTypes.DECIMAL(10, 2),
        },

        // The amount paid by cash
        cashAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },

        // The amount paid by check
        checkAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },

        // For japan we need POSTAL orders
        postalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },

        // The discount amount
        discountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0,
        },

        // The payee name
        payee: {
            type: DataTypes.STRING, // e.g., "ACME Corp."
            allowNull: true,
        },

        // Currency of the order
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        // returnAddressId: {
        //     type: DataTypes.INTEGER,
        //     references: {
        //         model: Address,
        //         key: "id"
        //     },
        //     onDelete: "SET NULL",
        // }

        createdAt: {
            type: DataTypes.DATEONLY, // ✅ only stores 'YYYY-MM-DD'
            allowNull: false,
            defaultValue: DataTypes.NOW, // sets current date
        },

        // The key code id
        keyCodeId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "key_code_details",
                key: "id",
            },
            onDelete: "SET NULL",
        },
        // companyId removed; derive via brand.company
        brandId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "brands",
                key: "id",
            },
        },
    },
    {
        sequelize,
        modelName: "Order",
        tableName: "orders",
        hooks: {
            beforeBulkUpdate(options) {
                if (!options.attributes) return;

                const { cashAmount, checkAmount, postalAmount } =
                    options.attributes;

                // Only recalc if any of the three fields is being updated
                const shouldRecalc =
                    cashAmount !== undefined ||
                    checkAmount !== undefined ||
                    postalAmount !== undefined;

                if (!shouldRecalc) return;

                // Use existing values if fields are NOT provided
                const cash = cashAmount ?? options.attributes.cashAmount ?? 0;
                const check =
                    checkAmount ?? options.attributes.checkAmount ?? 0;
                const postal =
                    postalAmount ?? options.attributes.postalAmount ?? 0;

                // Set the new amount
                options.attributes.amount =
                    Number(cash) + Number(check) + Number(postal);
            },
        },
        timestamps: true,
    }
);

export default Order;
