import sequelize from "../../../config/sequelize.js";
import { Op, or, Sequelize, Transaction } from "sequelize";
import Order from "../models/order.js";
import ClientOffer from "../../offers/models/clientOffer.js";
import OfferSequence from "../../offers/models/offerSequence.js";
import APIError from "../../../utils/APIError.js";
import Campaign from "../../campaigns/models/campaign.js";
import Client from "../../clients/models/client.js";
// import Sku from "../../offers/models/sku.js";
import Offer from "../../offers/models/offer.js";
// import SkuOrder from "../models/skuOrder.js";
import Chain from "../../offers/models/chain.js";
import Address from "../../campaigns/models/address.js";
import KeyCodeDetails from "../../campaigns/models/keyCodeDetails.js";
import clientServices from "../../clients/services/client.js";
import offerServices from "../../offers/services/offer.js";
import dayjs from "dayjs";
import offerPrintServices from "../../offers/services/offerPrint.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import Company from "../../companies/models/company.js";
import Brand from "../../companies/models/brand.js";
import keyCodeServices from "../../campaigns/services/keyCode.js";
import KeyCode from "../../campaigns/models/keyCode.js";
import OfferPrint from "../../offers/models/offerPrint.js";

class OrderServices {
    /**
     * Place an order with transaction handling
     * @param {Object} orderData - Order data
     * @param {number} orderData.clientOfferId - Client offer ID
     * @param {number} orderData.paidAmount - Cash amount for the order
     * @param {number} orderData.discountAmount - Discount amount for the order
     * @param {string} orderData.type - Type of the order (cash or check)
     * @param {string} orderData.payee - Payee of the order
     * @returns {Promise<{order: Order, message: string}>} - Created order and message
     */
    async placeOrder({
        amount,
        discountAmount,
        checkAmount,
        cashAmount,
        postalAmount,
        payee,
        skus,
        currency,
        clientOfferId,
        t, // You can pass your own transaction
    }) {
        let transaction = null;

        if (t) {
            transaction = t;
        } else {
            // Start a transaction to ensure all operations succeed or fail together
            transaction = await sequelize.transaction({
                isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
            });
        }

        // To know if there is the next offer is generated before or not.
        // and to know wether we ended the chain of offers
        let message = null;

        try {
            // Encapsulate this in a stand alond function later
            // Verify the client offer exists and matches the id
            let initialClientOffer = await ClientOffer.findOne({
                where: {
                    id: clientOfferId,
                },
                include: [
                    {
                        model: Client,
                        as: "client",
                    },
                    {
                        model: OfferSequence,
                        as: "currentSequence",

                        include: {
                            model: Offer,
                            as: "currentOffer",
                            // include: {
                            //     model: Sku, // Commented out
                            //     through: {
                            //         attributes: [],
                            //     },
                            //     as: "skus", // Commented out
                            // },
                        },
                    },
                    {
                        model: Campaign,
                        as: "campaign",
                        // include: {
                        //     model: Address,
                        //     as: "mainPoBox",
                        // },
                    },
                    {
                        model: Chain,
                        as: "chain",
                        // include: [
                        //     {
                        //         model: OfferSequence,
                        //         as: "offerSequence"
                        //     }
                        // ]
                    },
                ],
                transaction,
            });

            if (!initialClientOffer) {
                throw new APIError(
                    "Client offer not found or code mismatch",
                    404,
                    "CLIENT_OFFER_NOT_FOUND"
                );
            }

            let clientOffer;

            // Check if there is an orignal offer
            if (initialClientOffer.originalOfferId) {
                // Do another query to get the original one
                clientOffer = await ClientOffer.findOne({
                    where: {
                        id: initialClientOffer.originalOfferId, // Get the original offer
                    },
                    include: [
                        {
                            model: Client,
                            as: "client",
                        },
                        {
                            model: OfferSequence,
                            as: "currentSequence",

                            include: {
                                model: Offer,
                                as: "currentOffer",
                                // include: {
                                //     model: Sku,
                                //     through: {
                                //         attributes: [],
                                //     },
                                //     as: "skus",
                                // },
                            },
                        },
                        {
                            model: Campaign,
                            as: "campaign",
                            // include: {
                            //     model: Address,
                            //     as: "mainPoBox",
                            // },
                        },
                        {
                            model: Chain,
                            as: "chain",
                            // include: [
                            //     {
                            //         model: OfferSequence,
                            //         as: "offerSequence",
                            //     },
                            // ],
                        },
                    ],

                    transaction,
                });
            } else {
                // In case there is no one take the cached one
                clientOffer = initialClientOffer;
            }

            if (clientOffer.currentSequence.currentOffer.type === "product") {
                throw new APIError(
                    "Offer products can't place orders for it found or code mismatch",
                    404,
                    "PRODUCT_OFFER_NOT_FOUND"
                );
            }

            // If there is an original offer it will affect all the remainging logic
            // Remove the client id from the client datavalues object

            delete clientOffer.client.dataValues.id;
            // Remove client's createdAt and updatedAt to prevent overwriting Order's default createdAt
            delete clientOffer.client.dataValues.createdAt;
            delete clientOffer.client.dataValues.updatedAt;

            // Get brandId from client offer, campaign, chain, or client
            const brandId =
                clientOffer?.brandId ||
                clientOffer?.campaign?.brandId ||
                clientOffer?.chain?.brandId ||
                clientOffer?.client?.brandId ||
                null;

            // Create the order
            const order = await Order.create(
                {
                    clientOfferId: clientOffer.id,
                    amount,
                    checkAmount,
                    cashAmount,
                    postalAmount,
                    payee,
                    discountAmount,
                    currency,
                    // To know what is the key code we added order to
                    keyCodeId: clientOffer.keyCodeId,

                    clientId: clientOffer.clientId,
                    // copy the offer title, campaign, chain
                    campaignCode: clientOffer?.campaign?.code,
                    // campaignTitle: clientOffer?.campaign?.title,
                    chainTitle: clientOffer?.chain?.title,
                    offerTitle:
                        clientOffer?.currentSequence?.currentOffer?.title,

                    offerId: clientOffer?.currentSequence?.currentOfferId,
                    chainId: clientOffer?.chainId,
                    campaignId: clientOffer?.campaignId,

                    brandId: brandId,

                    // Take the entire client data
                    ...clientOffer.client.dataValues,
                },
                { transaction }
            );

            // Update last purchase date
            await Client.update(
                { lastPurchaseDate: new Date() },
                { where: { id: clientOffer.clientId }, transaction }
            );

            // // Get the skus information
            // const skusData = await Sku.findAll({
            //     where: {
            //         id: skus,
            //     },
            //     transaction,
            // });

            // // Create the sku order
            // await SkuOrder.bulkCreate(
            //     skusData.map((sku) => ({
            //         orderId: order.id,
            //         price: sku.price,
            //         currency: sku.currency,
            //         title: sku.title,
            //         skuId: sku.id,
            //     })),
            //     { transaction }
            // );

            if (clientOffer.currentSequenceId) {
                // Get the offer sequence to retrieve the chain_id
                const offerSequence = await OfferSequence.findByPk(
                    clientOffer.currentSequenceId,
                    {
                        transaction,
                    }
                );

                if (!offerSequence) {
                    throw new APIError(
                        "Offer sequence not found",
                        404,
                        "OFFER_SEQUENCE_NOT_FOUND"
                    );
                }

                // Take the message from here
                message = await offerServices.generateNextOffer(
                    transaction,
                    offerSequence,
                    clientOffer
                );

                // Validate it's a string
                if (typeof message !== "string") {
                    message = null; // Reset the message
                }
            }

            // Here you must create the offer print for that client offer in case it was client service
            if (initialClientOffer.originalOfferId) {
                // Add a mail to the campaign that come from
                await offerPrintServices.addMail({
                    poBoxId: initialClientOffer?.offer.returnAddressId,
                    campaignId: initialClientOffer.campaignId,
                    clientId: initialClientOffer.clientId,
                    offerId: initialClientOffer.currentSequence.currentOffer.id,
                    offerCode: initialClientOffer.code,
                    keyCodeId: initialClientOffer.keyCodeId,
                    availableAt: initialClientOffer.availableAt,
                    transaction,
                });
            }

            /*
                select offers.type as type, count(offers.type) as count from client_offers join offer_Sequences on offer_sequences."id" = client_offers."currentSequenceId" join offers on offers.id = offer_sequences."currentOfferId" group by offers.type;
            */

            // Commit the transaction (if it's your transaction)
            if (!t) await transaction.commit();

            // Return the created order
            return {
                order,
                message,
            };
        } catch (error) {
            // Rollback the transaction if any error occurs (if it's your transaction)
            if (!t) await transaction.rollback();
            throw error;
        }
    }

    async placeOrderNotSelected({
        amount,
        discountAmount,
        cashAmount,
        checkAmount,
        postalAmount,
        payee,
        skus,
        currency,
        totalAmount,
        clientId,
        chainId,
        offerId,
        campaignId,
    }) {
        try {
            let foundCampignId = campaignId; // Initialize with passed campaignId

            // IMPORRTANT NOTE
            // If we are here the client mustn't have any client offer
            // So for now we will try to detect if there is a chain in case no chain given
            // And we will take the last chain we found (from creation date)
            if (!chainId) {
                // Find the first offer sequence that has the offer as current offer
                // and the client as client. from that grap the chain Id
                const offerSequence = await OfferSequence.findOne({
                    where: {
                        currentOfferId: offerId,
                        chainId: {
                            [Op.ne]: null,
                        },
                    },
                    order: [["createdAt", "DESC"]],
                });

                if (!offerSequence) {
                    throw new APIError(
                        "Offer sequence not found",
                        404,
                        "OFFER_SEQUENCE_NOT_FOUND"
                    );
                }

                // Grap the chain id
                chainId = offerSequence.chainId;

                // Calculate date 10 days from now using dayjs
                const tenDaysFromNow = dayjs().add(10, "day").toDate();

                if (!foundCampignId) {
                    // Find the campaign that holds this chain
                    const campaign = await Campaign.findOne({
                        where: {
                            chainId: chainId,
                            // Make sure to get the latest one without affecting the future
                            mailDate: {
                                [Op.lte]: tenDaysFromNow,
                            },
                        },
                        order: [["mailDate", "DESC"]],
                    });

                    if (campaign) {
                        foundCampignId = campaign.id;
                    }
                }
            }

            const clientOffer = await offerServices.createClientOfferAt({
                clientId,
                chainId,
                campaignId: foundCampignId,
                offerId,
            });

            // Now place the order
            const result = await this.placeOrder({
                clientOfferId: clientOffer.id,
                amount,
                discountAmount,
                cashAmount,
                checkAmount,
                postalAmount,
                payee,
                skus,
                currency,
                totalAmount,
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    // The offer is related directly to the order so you can join directly with the offer instead of goind through the client offer
    async getOrders(offset, limit, filters = null) {
        // Import Brand (with nested Company) for eager loading

        // Build where clause and brand join filters for company/brand
        let whereClause = {};

        if (filters) {
            whereClause = filtersParser(filters);
        }

        // Use findAllAndCount to get both orders and total count in one query
        let { rows: orders, count: totalCount } = await Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: ClientOffer,
                    as: "clientOffer",
                    include: [
                        { model: Campaign, as: "campaign" },
                        {
                            model: OfferSequence,
                            as: "currentSequence",
                            include: [
                                { model: Offer, as: "currentOffer" },
                                { model: Chain, as: "chain" },
                                // { model: Address, as: "address" },
                            ],
                        },
                    ],
                },
                // {
                //     model: Sku,
                //     attributes: [],
                //     through: {
                //         attributes: [],
                //     },
                //     as: "skus",
                // },
                {
                    model: Offer,
                    as: "offer",
                },
                {
                    model: KeyCodeDetails,
                    as: "keyCode",
                },
                {
                    model: Brand,
                    as: "brand",
                    attributes: ["id", "name", "companyId"],
                    include: [
                        {
                            model: Company,
                            as: "company",
                            attributes: ["id", "name"],
                        },
                    ],
                },
            ],
            distinct: true,
            order: [["id", "DESC"]],
            offset,
            limit,
        });

        // orders = orders.map((order) => ({
        //     id: order.id,
        //     amount: order.amount,
        //     type: order.type,
        //     orderDate: order.created_at,
        //     campaign: {
        //         id: order.ClientOffer?.Campaign?.id,
        //         title: order.ClientOffer?.Campaign?.title,
        //         code: order.ClientOffer?.Campaign?.code,
        //         country: order.ClientOffer?.Campaign?.country,
        //     },
        //     client: {
        //         firstName: order.client_first_name,
        //         lastName: order.client_last_name,
        //         email: order.client_email,
        //         address1: order.client_address_1,
        //         address2: order.client_address_2,
        //         zipCode1: order.client_zip_code_1,
        //         zipCode2: order.client_zip_code_2,
        //         phone: order.client_phone,
        //         country: order.client_country,
        //     },
        //     sku: {
        //         id: order.Sku?.id,
        //         price: order.Sku.price,
        //         currency: order.Sku.currency,
        //         title: order.Sku.title,
        //     },
        //     offer: {
        //         id: order.ClientOffer?.OfferSequence?.Offer?.id,
        //         title: order.ClientOffer?.OfferSequence?.Offer?.title,
        //     },
        // }));

        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(totalCount / limit);

        return {
            data: orders,
            pagination: {
                total: totalCount,
                pages: totalPages,
                page: currentPage,
                limit,
            },
        };
    }

    async getOrdersSummary(offset = 0, limit = 10, filters = null) {
        let passedFilters = {};
        if (filters) {
            passedFilters = filtersParser(filters);
        }

        try {
            const result = await Order.findAll({
                attributes: [
                    "brandId",
                    "country",
                    "currency",
                    "createdAt",
                    [Sequelize.fn("SUM", Sequelize.col("amount")), "totalPaid"],
                    [
                        Sequelize.fn("COUNT", Sequelize.col("Order.id")),
                        "totalOrders",
                    ],
                    [
                        Sequelize.fn("SUM", Sequelize.col("cashAmount")),
                        "totalCash",
                    ],
                    [
                        Sequelize.fn("SUM", Sequelize.col("checkAmount")),
                        "totalChecks",
                    ],
                    [
                        Sequelize.fn("SUM", Sequelize.col("discountAmount")),
                        "totalDiscount",
                    ],
                    [
                        Sequelize.literal(
                            'SUM("amount") - SUM("discountAmount")'
                        ),
                        "totalAfterDiscount",
                    ],
                ],
                include: [
                    {
                        model: Brand,
                        as: "brand",
                        attributes: ["id", "name", "companyId"],
                        include: [
                            {
                                model: Company,
                                as: "company",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                ],
                group: [
                    "Order.brandId",
                    "Order.country",
                    "Order.currency",
                    "Order.createdAt",
                    "brand.id",
                    "brand.company.id",
                ],
                raw: false,
                subQuery: false,
                where: passedFilters,
                offset,
                limit,
            });

            // Convert to plain objects with proper nested structure
            return result.map((row) => row.toJSON());
        } catch (err) {
            throw err;
        }
    }

    async deleteOrder(orderId) {
        const t = await sequelize.transaction();
        try {
            // Get the order details
            const order = await Order.findByPk(orderId, {
                include: [
                    {
                        model: ClientOffer,
                        as: "clientOffer",
                    },
                ],
            });

            if (!order) {
                throw new APIError(
                    "The order is either deleted. Or it's not exists in the first place",
                    404,
                    "NOT_FOUND"
                );
            }

            // Get the offer of the order and next offers in the chain from that offer
            const { offersIds, indexMapper, productOfferIds } =
                await offerServices.getNextOffers(order.offerId, order.chainId);

            // NOW you are good to go

            // 1. Affect key codes (not the details. Affect the relation between clients and segemnt)
            const { data: clientKeyCodes } = await keyCodeServices.getKeyCodes({
                takeLimitAndOffset: false,
                filters: {
                    campaignId: [{ eq: order.campaignId }],
                    offerId: [{ in: offersIds }],
                    clientId: [{ eq: order.clientId }],
                },
            });

            // Filter out nulls because VALUES cannot contain NULL rows
            const filteredKeyIds = clientKeyCodes
                .map((rec) => rec.id)
                .filter((id) => id !== null); // remove nulls

            // There are some segments where there is no order for them yet. WE need only THOSE. LEFT join can help with that
            const segQuery = `
                WITH key_codes_list(id) AS (
                    VALUES ${filteredKeyIds.map((id) => `(${id})`).join(", ")}
                )
                SELECT
                    kc.id AS "keyCodeId",
                    kcd.key AS "keyString",
                    COUNT(DISTINCT o.id) AS "orderCount",
                    COUNT(DISTINCT op.id) AS "mailFileCount"
                FROM key_codes_list kcl

                LEFT JOIN key_codes kc
                    ON kc.id = kcl.id

                LEFT JOIN key_code_details kcd
                    ON kcd.id = kc."keyId"

                LEFT JOIN orders o
                    ON o."keyCodeId" = kc.id

                LEFT JOIN offer_prints op
                    ON op."keyCodeId" = kcd.id

                GROUP BY kc.id, kcd.key
                HAVING 
                    COUNT(DISTINCT o.id) <= 1
                    AND COUNT(DISTINCT op.id) <= 1;

            `;

            let keyCodeOrderCounts = await sequelize.query(segQuery, {
                type: sequelize.QueryTypes.SELECT,
                transaction: t,
            });

            // This is the default case where there is nothing to delete
            if (
                keyCodeOrderCounts.length === 1 &&
                keyCodeOrderCounts[0].keyCodeId === null &&
                keyCodeOrderCounts[0].keyString === null &&
                keyCodeOrderCounts[0].orderCount === "0" &&
                keyCodeOrderCounts[0].mailFileCount === "0"
            )
                keyCodeOrderCounts = [];

            let deletedKeysCount = 0;
            // Remove the subscription for that client in those offers in this campaign
            // Only remove key codes that have 0 or 1 orders
            if (keyCodeOrderCounts.length > 0) {
                // take those to filter by
                const filterBy = keyCodeOrderCounts.map((record) =>
                    String(record.keyCodeId)
                );

                // Now filter the relations between the clients and the segements
                const finalIds = clientKeyCodes
                    .filter((data) =>
                        filterBy.includes(String(data.dataValues.id))
                    )
                    .map((rec) => rec.id);

                const d = await keyCodeServices.removeUsersFromSegments(
                    finalIds,
                    t
                );
                deletedKeysCount += +d;
            }

            // 2. Affect mail files (offer print records)

            // First let's build the Where clause for this operaiton
            let deleteMailsWhere = clientKeyCodes.map((keyCode) => {
                // This contains all the necessary infromation to detect what we want to delete
                return {
                    campaignId: keyCode.campaignId,
                    keyCodeId: keyCode.keyId,
                    clientId: keyCode.clientId,
                    offerId: keyCode.offerId,
                };
            });

            // Add product offers to deleteMailsWhere with keyCodeId set to null
            productOfferIds.forEach((offerId) => {
                deleteMailsWhere.push({
                    campaignId: order.campaignId,
                    keyCodeId: null,
                    clientId: order.clientId,
                    offerId: offerId,
                });
            });

            // For each one on this where clause. This will delete only one mail file
            let totalDeleted = 0;
            for (const whereCondition of deleteMailsWhere) {
                try {
                    const deleted = await offerPrintServices._deleteMails(
                        whereCondition,
                        t
                    );
                    totalDeleted += deleted;
                } catch (err) {
                    // If a mail file is not found, continue to the next one
                    console.log(
                        "Mail file not found for condition:",
                        whereCondition
                    );
                }
            }

            // 3. Delete the client offer (the core) after checking that this
            // First exctract the sequence id to be able to detect the client offers
            const deleteClientOffersWhere = [];

            // For each offer find all the sequences to be able to identify the clinet offers
            deleteMailsWhere.forEach((rec) => {
                // Skip product offers in this loop
                if (productOfferIds.includes(rec.offerId)) {
                    return;
                }
                // What is the offer sequnce for the given offer
                // Check the mapper. Remeber the offer can be exists in two different sequences. and they belong to same segment because they are the same offer !
                indexMapper[rec.offerId].forEach((seqId) => {
                    deleteClientOffersWhere.push({
                        campaignId: rec.campaignId,
                        clientId: rec.clientId,
                        keyCodeId: rec.keyCodeId,
                        currentSequenceId: seqId,
                    });
                });
            });

            // Add product offers to deleteClientOffersWhere with keyCodeId set to null
            productOfferIds.forEach((offerId) => {
                deleteClientOffersWhere.push({
                    campaignId: order.campaignId,
                    clientId: order.clientId,
                    keyCodeId: null,
                    currentSequenceId: indexMapper[offerId][0],
                });
            });

            // See if there are many orders for each client offer
            const mailFiles =
                (await offerServices._getMailFiles(
                    {
                        [Op.or]: deleteClientOffersWhere,
                    },
                    t
                )) || [];

            // Take those IDs
            const ids = mailFiles.map((rec) => rec.id);

            const replacements = { ids };

            // 1 mail and 0 order, 0 mail and 1 order, 0 for both or 1 for both. These cases for delete
            // Some client offers doesn't have any order so the query will not return them. because they already filtered out with IN statement
            // Also here we need to care about the offer print so in case there is 2 or more offer print records we will not delete the client offer
            const clientOfferQuery = `
                WITH mail_files(id) AS (
                    VALUES ${ids.map((id) => `(${id})`).join(", ")}
                )
                SELECT
                    co.id AS "clientOfferId",
                    co.code AS "code",
                    COUNT(o.id) AS "orderCount",
                    COUNT(op."offerCode") AS "mailFileCount"
                FROM mail_files mf

                LEFT JOIN client_offers co
                    ON co.id = mf.id

                LEFT JOIN orders o
                    ON o."clientOfferId" = co.id

                LEFT JOIN offer_prints op
                    ON op."offerCode" = co.code

                GROUP BY co.id, co.code
                HAVING
                    (COUNT(o.id) + COUNT(op."offerCode")) <= 1;
            `;

            // Here we can access them with LEFT join
            const clientOfferToDel = await sequelize.query(clientOfferQuery, {
                type: sequelize.QueryTypes.SELECT,
                replacements,
            });

            // Delete the client offers that have only one or zero orders
            if (clientOfferToDel.length > 0) {
                await offerServices._deleteMailFiles(
                    {
                        id: {
                            [Op.in]: clientOfferToDel.map(
                                (rec) => rec.clientOfferId
                            ),
                        },
                    },
                    t
                );
            }

            // Delete that order
            await Order.destroy({
                where: {
                    id: orderId,
                },
                transaction: t,
            });

            // await t.rollback();
            await t.commit();

            return true;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async updateOrder(id, data) {
        try {
            const [, [newOrder]] = await Order.update(data, {
                where: {
                    id,
                },
                returning: true,
            });

            return newOrder;
        } catch (err) {
            throw err;
        }
    }
}

export default new OrderServices();
