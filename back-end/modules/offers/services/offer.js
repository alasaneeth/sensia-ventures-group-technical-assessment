import Offer from "../models/offer.js";
import OfferSequence from "../models/offerSequence.js";
import APIError from "../../../utils/APIError.js";
import sequelize from "../../../config/sequelize.js";
// import Sku from "../models/sku.js";

import { Op, Sequelize } from "sequelize";
import Client from "../../clients/models/client.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import keyCodeServices from "../../campaigns/services/keyCode.js";

import Campaign from "../../campaigns/models/campaign.js";
import Chain from "../../offers/models/chain.js";
import ClientOffer from "../models/clientOffer.js";

import { addDays } from "date-fns";
import { normalizeDate } from "../../../utils/normalizeDate.js";
import offerPrintServices from "../services/offerPrint.js";

import Brand from "../../companies/models/brand.js";
import Company from "../../companies/models/company.js";

class OfferServices {
    /**
     * Create a new offer
     * @param {Object} offerData - Offer data to create
     * @param {Array} skus - Array of SKU IDs to associate with the offer
     * @returns {Promise<Object>} - Created offer data
     */
    async createOffer(offerData, skus) {
        const t = await sequelize.transaction();
        try {
            // Create offer
            const offer = await Offer.create(offerData, { transaction: t });
            console.log(
                "\n####### here are our skus #########\n",
                skus,
                "\n################\n"
            );

            // Associate Bundle SKUs with the offer via Offer-BundleSku relation
            // `skus` here is an array of bundleSku IDs
            if (Array.isArray(skus) && skus.length > 0) {
                await offer.setSkus(skus, { transaction: t });
            }

            await t.commit();

            return offer;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async deleteOffer(id) {
        try {
            const isDeleted = await Offer.destroy({ where: { id } });
            if (!isDeleted) {
                throw new APIError(
                    "The offer isn't found or it's already deleted",
                    404,
                    "NOT_FOUND"
                );
            }

            return isDeleted;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get offer by ID with complete details
     * @param {number|string} id - Offer ID
     * @returns {Promise<Object>} - Offer data
     */
    async getOffer(id) {
        try {
            // Find the offer by ID
            const offer = await Offer.findByPk(id, {
                // attributes: { exclude: ["return_address"] },
                include: [
                    // {
                    //     model: Sku,
                    //     through: { attributes: [] },
                    //     as: "skus",
                    // },
                    {
                        model: Brand,
                        as: "brand",
                        attributes: ["id", "name", "companyId"],
                        required: false,
                        include: [
                            {
                                model: Company,
                                as: "company",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                ],
            });

            if (!offer) {
                throw new Error(`Offer with ID ${id} not found`);
            }

            // Format the return address
            // if (offer.Address) {
            //     offer.dataValues.return_address = offer.Address.address;
            //     delete offer.dataValues.Address;
            // }

            return offer.toJSON();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all offers with pagination
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Number of records to return
     * @returns {Promise<Object>} - Offers with pagination info
     */
    async getOffers(
        offset = 0,
        limit = 10,
        includeNotInChain = true,
        filters = {},
        orFields = [],
        sortField = null,
        sortDirection = "ASC"
    ) {
        try {
            let whereClause = filtersParser(filters, orFields);

            ////////////////// TEMP please don't rely on it
            // If theme is provided, modify porter condition to be OR with null
            if (filters.theme && filters.porter) {
                // Find the porter value from filters
                const porterValue = filters.porter[0]?.eq;

                if (porterValue && whereClause[Op.and]) {
                    // Find and remove the porter condition from AND array
                    const porterIndex = whereClause[Op.and].findIndex(
                        (condition) => condition.porter !== undefined
                    );

                    if (porterIndex !== -1) {
                        // Remove porter from AND conditions
                        whereClause[Op.and].splice(porterIndex, 1);

                        // Add OR condition for porter
                        if (whereClause[Op.or]) {
                            whereClause[Op.or].push(
                                { porter: { [Op.eq]: porterValue } },
                                { porter: { [Op.is]: null } }
                            );
                        } else {
                            whereClause[Op.or] = [
                                { porter: { [Op.eq]: porterValue } },
                                { porter: { [Op.is]: null } },
                            ];
                        }
                    }
                }
            }

            let includeStatement = {
                // include: [
                //     {
                //         model: Address,
                //         as: "returnAddress",
                //     },
                // ],
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
            };

            // To not show the offers that isn't exists in a chain
            if (!includeNotInChain) {
                includeStatement.include.push({
                    model: OfferSequence,
                    as: "currentOfferSequences",
                    where: {
                        chainId: { [Op.ne]: null },
                    },
                });
            }

            // Get offers with pagination
            const { rows: offers, count: totalCount } =
                await Offer.findAndCountAll({
                    attributes: {
                        // exclude: ["return_address"],
                        include: [
                            [
                                //         sequelize.literal(`
                                //     CASE WHEN EXISTS (
                                //         SELECT 1
                                //         FROM sku_offers
                                //         WHERE sku_offers."offerId" = "Offer".id
                                //         ) THEN 1 ELSE 0 END
                                // `),
                                sequelize.literal("0"),
                                "skuExists",
                            ],
                        ],
                    },
                    distinct: true,
                    include: includeStatement.include,
                    offset,
                    limit,
                    where: whereClause,
                    order: sortField
                        ? [[sortField, sortDirection]]
                        : [["id", "DESC"]],
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            // offers.forEach((offer) => {
            //     offer.dataValues.return_address = offer.Address.address;
            //     delete offer.dataValues.Address;
            // });

            // Convert offers to plain JSON to ensure associations are properly serialized
            const serializedOffers = offers.map((offer) => offer.toJSON());

            return {
                data: serializedOffers,
                pagination: {
                    total: totalCount,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    async updateOffer(id, payload) {
        try {
            const [_, newOffer] = await Offer.update(payload, {
                where: {
                    id,
                },
                returning: true,
            });

            return newOffer[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     *
     * Get enrolled clients with pagination and related data
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Number of records to return
     * @param {number|null} campaignId - Optional campaign ID filter
     * @returns {Promise<Object>} Enrolled clients with pagination info
     */
    async getMailFiles({
        offset = 0,
        limit = 10,
        campaignId = null,
        filters = null,
        takeLimitAndOffset = true,
    }) {
        try {
            // Build where clause for campaign filtering if provided
            const whereClause = {};
            if (campaignId !== null) {
                whereClause.campaignId = campaignId;
            }

            // Apply additional filters if provided
            if (filters) {
                const parsedFilters = filtersParser(filters);
                Object.assign(whereClause, parsedFilters);
            }

            // console.log("REally here ?", whereClause);

            // Get enrolled clients with all related data and filters
            const { rows: clientOffers, count: totalCount } =
                await ClientOffer.findAndCountAll({
                    where: whereClause,
                    include: [
                        // Include campaign with chain
                        {
                            model: Campaign,
                            attributes: ["id", "code"],
                            as: "campaign",
                        },
                        {
                            model: Client,
                            as: "client",
                        },
                        {
                            model: Chain,
                            attributes: ["id", "title"],
                            as: "chain",
                        },
                        {
                            model: Brand,
                            as: "brand",
                            attributes: ["id", "name"],
                            include: {
                                model: Company,
                                as: "company",
                                attributes: ["id", "name"],
                            },
                            required: false,
                        },
                        // Include current sequence with offer details
                        {
                            model: OfferSequence,
                            as: "currentSequence",
                            include: [
                                {
                                    model: Offer,
                                    as: "currentOffer",
                                    attributes: ["id", "title", "description"],
                                },
                            ],
                        },
                    ],
                    ...(takeLimitAndOffset ? { offset, limit } : {}),
                    order: [["id", "DESC"]],
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: clientOffers,
                pagination: {
                    total: totalCount,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search for client offer by code
     * @param {string} code - Offer code to search for
     * @returns {Promise<Object>} - Found client offer or empty result
     */
    async searchClientOfferByCode(code) {
        try {
            if (!code) {
                return null;
            }

            // Don't panic it's simple query :) I tried to extract the common includes to single array but it throws an error
            // Find the client offer with the exact code
            const clientOffer = await ClientOffer.findOne({
                where: {
                    code: code.trim(),
                },
                include: [
                    {
                        model: Client,
                        as: "client",
                    },
                    {
                        model: Campaign,
                        as: "campaign",
                    },
                    {
                        model: Brand,
                        as: "brand",
                        attributes: ["id", "name"],
                        required: false,
                    },
                    {
                        model: OfferSequence,
                        as: "currentSequence",
                        include: [
                            {
                                model: Offer,
                                as: "currentOffer",
                                // attributes: ["id", "title", "description"],
                                // include: {
                                //     model: Sku,
                                //     through: {
                                //         attributes: [],
                                //     },
                                //     as: "skus",
                                // },
                            },
                        ],
                    },
                    {
                        model: Chain,
                        as: "chain",
                    },
                    {
                        // Include the original offer if exists
                        model: ClientOffer,
                        as: "originalOffer",
                        include: [
                            {
                                model: Client,
                                as: "client",
                            },
                            {
                                model: Campaign,
                                as: "campaign",
                            },
                            {
                                model: OfferSequence,
                                as: "currentSequence",
                                include: [
                                    {
                                        model: Offer,
                                        as: "currentOffer",
                                        // attributes: ["id", "title", "description"],
                                        // include: {
                                        //     model: Sku,
                                        //     through: {
                                        //         attributes: [],
                                        //     },
                                        //     as: "skus",
                                        // },
                                    },
                                ],
                            },
                            {
                                model: Chain,
                                as: "chain",
                            },
                        ],
                    },
                ],
            });

            if (!clientOffer) {
                return null;
            }

            // When the offer point to another offer take what it points to
            if (clientOffer.originalOfferId) {
                return { data: clientOffer.originalOffer };
            }

            // Simplify the response structure.
            return {
                data: clientOffer,
            };
        } catch (error) {
            throw error;
        }
    }

    async searchClientOfferByOffer(offerId, clientId) {
        try {
            const clientOffers = await ClientOffer.findAll({
                where: {
                    "$currentSequence.currentOffer.id$": offerId,
                    clientId,
                },
                include: [
                    {
                        model: Client,
                        as: "client",
                    },
                    {
                        model: OfferSequence,
                        as: "currentSequence",
                        include: [
                            {
                                model: Offer,
                                as: "currentOffer",
                            },
                        ],
                    },
                    {
                        model: Campaign,
                        as: "campaign",
                    },
                    {
                        model: Chain,
                        as: "chain",
                    },
                ],
                order: [
                    [{ model: Campaign, as: "campaign" }, "mailDate", "DESC"],
                ],
                limit: 1,
            });

            const clientOffer =
                clientOffers.length > 0 ? clientOffers[0] : null;
            return clientOffer;
        } catch (err) {
            throw err;
        }
    }

    // create a client offer at specific offer on a chain
    // When toOffer is passed. we are creating client serveices offer otherwise it's a normal offer that's it
    // And when there is a to offer the data (offer and campaign will be different they will be for the clietn serveice campaign)
    async createClientOfferAt({
        clientId,
        chainId,
        campaignId,
        offerId,
        toOffer = null,
        transaction,
    }) {
        try {
            const client = await Client.findByPk(clientId);

            if (!client) {
                throw new APIError("Client not found", 404, "CLIENT_NOT_FOUND");
            }

            // 2. get the sequence using the given chain and offer (in case we need a normal offer not a client service or payment reminder)
            let offerSequence = await OfferSequence.findOne({
                where: {
                    ...(toOffer === null ? { chainId } : {}),
                    currentOfferId: offerId,
                },
                ...(transaction ? { transaction } : {}),
            });

            // You must not create or that will not happen. you can't palce an order for a stand alone offer. it must exist in one
            // offer sequence at least. meaing the else if block will never run
            if (!offerSequence && chainId) {
                throw new APIError(
                    "Offer sequence not found",
                    404,
                    "OFFER_SEQUENCE_NOT_FOUND"
                );
            } else if (!offerSequence && !chainId) {
                // When setting order by only offer nothing more nothing less
                // Create the sequence
                offerSequence = await OfferSequence.create(
                    {
                        daysToAdd: 0,
                        currentOfferId: offerId,
                        chainId: null,
                    },
                    {
                        ...(transaction ? { transaction } : {}),
                    }
                );
            }

            // When there is a toOffer you must create the client offer not lookup for already created one

            //// FROM THIS CONDITION IT'S FOR CLIENT SERVICES OFFER. NOTE this service function must not be reached if there is a client offer . this supposed to be create client offer so when you call it make sure you don't have one
            if (toOffer !== null) {
                // Check if a client offer already exists for this client, campaign, chain, and offer sequence
                const existingClientOffer = await ClientOffer.findOne({
                    where: {
                        clientId: clientId,
                        chainId: chainId,
                        campaignId: campaignId,
                        currentSequenceId: offerSequence.id,
                        // Don't get the client offer if it's a service or no-payement offer
                        originalOfferId: {
                            [Op.ne]: null,
                        },
                    },
                    ...(transaction ? { transaction } : {}),
                });

                // If the offer is found meaing it's for sure belongs to a segemnt even unknown one
                if (existingClientOffer) {
                    // Return the existing client offer instead of creating a new one
                    return existingClientOffer;
                }
            }

            // Get companyId and brandId from campaign or chain
            // Only get campaign if campaignId is provided
            let campaign = null;
            let brandId = null;

            if (campaignId) {
                campaign = await Campaign.findByPk(campaignId, {
                    ...(transaction ? { transaction } : {}),
                });
                brandId = campaign.brandId;
            }

            // 3. start by creating the client offer instance if none exists
            let [clientOffer] = await ClientOffer.bulkCreate(
                [
                    {
                        currentSequenceId: offerSequence.id,
                        chainId: chainId,
                        campaignId: campaignId,
                        clientId: clientId,
                        originalOfferId: toOffer,
                        brandId: brandId,
                    },
                ],
                {
                    ...(transaction ? { transaction } : {}),
                }
            );

            // Create the segemnt as not unknown. note if the client offer is exists this line must be reached
            // Only create key code if we have a campaign
            if (campaign) {
                const keyCode = await keyCodeServices.upsertKeyCode(
                    clientOffer,
                    campaignId,
                    campaign.code,
                    offerId,
                    clientId,
                    clientOffer.keyCodeId, // This will be null because when we created we gave it null
                    1,
                    transaction
                );

                // Update the keycode inside the client offer (keyCode is already the ID)
                await clientOffer.update(
                    { keyCodeId: keyCode },
                    { ...(transaction ? { transaction } : {}) }
                );
            }

            return clientOffer;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate the next offer in the chain sequence
     * @param {Object} transaction - Database transaction
     * @param {Chain} chain - Chain instance
     * @param {ClientOffer} clientOffer - Client offer instance
     * @returns {Promise<string|ClientOffer>} - Created client offer
     */
    async generateNextOffer(transaction, offerSequence, clientOffer) {
        try {
            // If the type of the offer isn't an offer return
            if (clientOffer.currentSequence.currentOffer.type !== "offer")
                return "The offer isn't truly an offer. meaning nothing more to generate";

            // If there's no next offer, this is the end of the chain
            // Still need to create a print record for the current offer
            if (offerSequence.nextOfferId === null) {
                // Create print record for the current offer
                // await addMail(
                //     clientOffer.clientId,
                //     offerSequence.currentOfferId,
                //     clientOffer.code,
                //     clientOffer.availableAt,
                //     transaction
                // );
                return "The chain has ended. no more offers to generate";
            }

            // 1. take the current sequence extract the current offer id from it
            const currentOfferId = offerSequence.currentOfferId;

            // 1.1. Get all the sequence that has this current offer and chain and campaign
            // // Like in case A -> B, A -> C we got an order for A -> B we need to find A -> C
            const sequences = await OfferSequence.findAll({
                // attributes: ["id", 'currentOfferId', "nextOfferId", "daysToAdd"],
                where: {
                    currentOfferId,
                    chainId: clientOffer.chainId,
                },
            });

            // This map will help me later in the loop. When I will see the client
            const toOfferByOffer = {};
            sequences.forEach((sequence) => {
                // From offer to offer
                toOfferByOffer[sequence.nextOfferId] = {
                    fromOfferId: sequence.currentOfferId,
                    daysToAdd: sequence.daysToAdd,
                    sequenceId: sequence.id,
                };
            });

            // B -> ??, C -> ??
            // Find where each offer sequence lead to ?
            const relatedSequences = await OfferSequence.findAll({
                where: {
                    // currentOfferId: {
                    //     [Op.in]: sequelize.literal(`(
                    //     SELECT "nextOfferId"
                    //     FROM offer_sequences
                    //     WHERE "currentOfferId" = ${currentOfferId}
                    //     AND "chainId" = ${clientOffer.chainId}
                    //     AND "nextOfferId" IS NOT NULL
                    // )`),
                    // },
                    currentOfferId: {
                        [Op.in]: sequences.map((seq) => seq.nextOfferId),
                    },
                    chainId: clientOffer.chainId,
                },
                include: {
                    model: Offer,
                    as: "currentOffer",
                },
                // attributes: ["id", "currentOfferId", "nextOfferId"],
                transaction,
            });

            const sequenceIds = relatedSequences.map((seq) => seq.id);

            // If the client offer is activated then go find it extract the information from it and call it a day
            if (clientOffer.isActivated) {
                // 4. get the client offers where we do have all that current sequences id, and the chain with the campaign
                const nextOffers = await ClientOffer.findAll({
                    where: {
                        clientId: clientOffer.clientId,
                        campaignId: clientOffer.campaignId,
                        chainId: clientOffer.chainId,
                        currentSequenceId: { [Op.in]: sequenceIds },
                    },
                    include: [
                        {
                            model: OfferSequence,
                            as: "currentSequence",
                            required: true,
                            include: {
                                model: Offer,
                                as: "currentOffer",
                            },
                        },
                        {
                            model: Campaign,
                            as: "campaign",
                        },
                    ],
                    transaction,
                    logging: true,
                });

                // Create print records for each next offer
                for (const nextOffer of nextOffers) {
                    if (!nextOffer.currentSequence) continue;

                    // In case it's not the first take it from the chain
                    // if (
                    //     nextOffer.currentSequenceId !==
                    //     nextOffer.chain.offerSequenceId
                    // ) {
                    //     await addMail(
                    //         clientOffer?.chain?.returnAddressId,
                    //         clientOffer.campaignId,
                    //         nextOffer.clientId,
                    //         nextOffer.currentSequence.currentOfferId,
                    //         nextOffer.code,
                    //         nextOffer.availableAt,

                    //         transaction
                    //     );
                    // } else {
                    //     // Meaning it's from the first
                    //     await await addMail(
                    //         clientOffer?.campaign?.mainPoBoxId,
                    //         clientOffer.campaignId,
                    //         nextOffer.clientId,
                    //         nextOffer.currentSequence.currentOfferId,
                    //         nextOffer.code,
                    //         nextOffer.availableAt,

                    //         transaction
                    //     );
                    // }

                    // Calculate how many days to add after placing the order
                    // Remember that the current offer here was next offer in the previous calculation
                    const availableAt = addDays(
                        normalizeDate(new Date()),
                        toOfferByOffer[nextOffer.currentSequence.currentOfferId]
                            .daysToAdd
                    );

                    // 3. Set time to start of UTC day (00:00)
                    // 4. Format as YYYY-MM-DD to store in Postgres DATE column
                    // const availableAt = dayjs()
                    //     .utc()
                    //     .add(daysToAdd, "day")
                    //     .startOf("day")
                    //     .format("YYYY-MM-DD");

                    // Take the return address from offer
                    await offerPrintServices.addMail({
                        // poBoxId: clientOffer?.currentSequence?.currentOffer?.offerCampaigns[0]?.returnAddressId,
                        campaignId: clientOffer.campaignId,
                        clientId: nextOffer.clientId,
                        offerId: nextOffer.currentSequence.currentOfferId,
                        offerCode: nextOffer.code,
                        keyCodeId: nextOffer.keyCodeId,
                        availableAt,
                        brandId: clientOffer.brandId,

                        transaction,
                    });

                    //////// Check the segmenation for the next offers. in case the next offer is of type offer
                    // if (nextOffer.currentSequence.currentOffer.type === "offer") {
                    //     await upsertKeyCode(
                    //         nextOffer.campaignId,
                    //         nextOffer.campaign.code,
                    //         nextOffer.currentSequence.currentOfferId,
                    //         nextOffer.clientId,
                    //         nextOffer.keyCodeId, // Make sure to send this
                    //         currentOfferId,
                    //         transaction
                    //     );
                    // }
                }

                return "The next offer in the chain is already generated.";
            }

            // Here you have to create the client offers

            // A -> B, A -> C
            // This offer sequence open two+ offers
            // let openedOffers = await OfferSequence.findAll({
            //     attributes: ["nextOfferId"],
            //     where: {
            //         currentOfferId: offerSequence.currentOfferId, // If the offer A pointing to B and C
            //         chainId: offerSequence.chainId,
            //     },
            //     transaction,
            // });

            // openedOffers = openedOffers.map((seq) => seq.dataValues.nextOfferId);

            // // Get next offer sequences
            // const nextSequences = await sequelize.query(
            //     `
            //         SELECT DISTINCT ON ("currentOfferId")
            //                 offer_sequences.id AS id, "offer"."returnAddressId" AS "returnAddressId", "nextOfferId", "daysToAdd", "chainId", "currentOfferId"
            //         FROM offer_sequences
            //         LEFT JOIN offers offer ON "currentOfferId" = offer.id
            //         WHERE "currentOfferId" IN (:openedOffers) AND "chainId" = :chainId
            //     `,
            //     {
            //         replacements: { openedOffers, chainId: offerSequence.chainId },
            //         transaction,
            //         type: sequelize.QueryTypes.SELECT,
            //     }
            // );

            // Get the return addresses foreach offer
            // const returnAddresses = await Offer.findAll({
            //     attributes: ["returnAddressId"],
            //     where: {
            //         id: openedOffers,
            //     },
            //     transaction,
            // });

            // Make sure to get it from the client so this record get latest data from there
            const client = await Client.findByPk(clientOffer.clientId, {
                transaction,
            });

            // If the offer is pointing to many offers, prepare the object and call bulkCreate
            const createNextClientOffers = relatedSequences.map((seq) => {
                // Calculate the available date by adding days_to_add to current date
                const availableDate = addDays(
                    normalizeDate(new Date()),
                    toOfferByOffer[seq.currentOfferId].daysToAdd
                );

                return {
                    campaignId: clientOffer.campaignId,
                    currentSequenceId: seq.id,
                    chainId: offerSequence.chainId,
                    availableAt: availableDate, // This will be skipped in the client offers but keep it here I will use it in a second

                    clientId: client.id,
                    brandId: clientOffer.brandId, // Inherit brandId from the original clientOffer
                    _seq: seq, // This will be skipped by sequelize. add it here to be able to retreive it down there
                    _offerType: seq.currentOffer.type, // This will be skipped also.
                };
            });

            // Create the next client offer. Used bulkcreate to invoke the trigger
            const nextClientOffers = await ClientOffer.bulkCreate(
                createNextClientOffers,
                { transaction }
            );

            // Get the campaign details
            const campaignDetails = await Campaign.findByPk(
                clientOffer.campaignId,
                {
                    transaction,
                }
            );

            // Create print records for each next offer
            for (let i = 0; i < nextClientOffers.length; i++) {
                // Client offer
                const nextOffer = nextClientOffers[i];
                // This to get the number of days, the return address
                const { _seq = null, _offerType } = createNextClientOffers[i];

                if (_seq) {
                    //////// Check the segmenation for the next offers. in case the next offer is of type offer
                    let futureKeyCode = null;
                    if (_offerType === "offer") {
                        futureKeyCode = await keyCodeServices.upsertKeyCode(
                            nextOffer,
                            nextOffer.campaignId,
                            campaignDetails.code,
                            _seq.currentOfferId,
                            nextOffer.clientId,
                            clientOffer.keyCodeId,
                            i + 1, // Start by i then add 1 to it
                            transaction
                        );

                        // Update this specific client offer with its keyCode
                        await ClientOffer.update(
                            { keyCodeId: futureKeyCode },
                            {
                                where: { id: nextOffer.id },
                                transaction,
                            }
                        );
                    }

                    // Normal next offer will be from the chain
                    await offerPrintServices.addMail({
                        poBoxId: _seq.currentOffer.returnAddressId,
                        campaignId: nextOffer.campaignId,
                        clientId: nextOffer.clientId,
                        offerId: _seq.currentOfferId,
                        offerCode: nextOffer.code,
                        keyCodeId: futureKeyCode,
                        availableAt: nextOffer.availableAt,
                        brandId: clientOffer.brandId,
                        transaction,
                    });
                }
            }

            // Make the is_activated true for the current client offer.
            // To not generate another offer after the user place an order on the same offer
            await ClientOffer.update(
                { isActivated: true },
                {
                    where: {
                        id: clientOffer.id,
                    },
                    transaction,
                }
            );

            return nextClientOffers;
        } catch (error) {
            throw error;
        }
    }

    async addOfferLetter(
        offerLetterId,
        clientOfferId,
        clientId,
        offerId,
        chainId,
        campaignId
    ) {
        const t = await sequelize.transaction();
        try {
            let clientOffer = null;
            if (clientOfferId) {
                // Get the details from the client offer (original offer)
                clientOffer = await ClientOffer.findByPk(clientOfferId, {
                    include: [
                        {
                            model: OfferSequence,
                            as: "currentSequence",
                            include: [
                                {
                                    model: Offer,
                                    as: "currentOffer",
                                },
                                {
                                    model: Offer,
                                    as: "nextOffer",
                                },
                            ],
                        },
                    ],
                    transaction: t,
                });
            } else {
                /////////// This must go under unknown segemnt
                // Create an original client offer
                clientOffer = await this.createClientOfferAt({
                    campaignId,
                    clientId,
                    chainId,
                    offerId,
                    toOffer: null,
                    transaction: t,
                });

                // Get the data with some includes for this client offer
                clientOffer = await ClientOffer.findByPk(clientOffer.id, {
                    include: [
                        {
                            model: OfferSequence,
                            as: "currentSequence",
                            include: [
                                {
                                    model: Offer,
                                    as: "currentOffer",
                                },
                                {
                                    model: Offer,
                                    as: "nextOffer",
                                },
                            ],
                        },
                    ],
                    transaction: t,
                });
            }

            // Note that the offer letter must exists on a chain on a campaign. Edge case!
            const offerLetterInfo = await Offer.findByPk(offerLetterId, {
                include: [
                    {
                        model: OfferSequence,
                        as: "currentOfferSequences",
                        // include: [
                        //     // {
                        //     //     model: Chain,
                        //     //     as: "chain",
                        //     //     include: [
                        //     //         {
                        //     //             model: Campaign,
                        //     //             as: "campaigns",
                        //     //             where: {
                        //     //                 id: campaignId, // Take only the id
                        //     //             },
                        //     //         },
                        //     //     ],
                        //     // },
                        // ],
                    },
                ],
            });

            // Get the campaign that has id of the client offer. and further information like return address and printer
            const query = `
            SELECT 
                o.*,
                os.id             AS "offerSequenceId",
                os."chainId"      AS "offerSequenceChainId",
                c.id              AS "chainId",
                c."offerSequenceId" AS "chainOfferSequenceId",
                camp.id           AS "campaignId",
                camp."mailDate"   AS "campaignMailDate",
                camp."chainId"    AS "campaignChainId",
                co."returnAddressId",
                co."printer",
                co."payeeNameId"
            FROM offers o
            LEFT JOIN offer_sequences os
                ON os."currentOfferId" = o.id
            LEFT JOIN chains c
                ON c.id = os."chainId"
            LEFT JOIN campaigns camp
                ON camp."chainId" = c.id
            LEFT JOIN campaign_offers co
                ON co."offerId" = o.id AND co."campaignId" = camp.id
            WHERE o.id = :offerLetterId
            ORDER BY camp."mailDate" DESC
            LIMIT 1;
        `;

            const [offerLetter] = await sequelize.query(query, {
                replacements: { offerLetterId },
                type: Sequelize.QueryTypes.SELECT,
            });

            /*
        {
            id: 123,                        // offer id
            offerSequenceId: 456,
            chainId: 789,
            campaignId: 42,
            campaignMailDate: '2025-02-14',
            campaignName: 'Valentine Campaign',
            campaignChainId: 789
        }
        */

            console.log(
                "\n########   here    ########\n",
                offerLetter,
                "\n################\n"
            );

            // Create a record for the printer page for the client services offer
            let letterClientOffer = await this.createClientOfferAt({
                campaignId: offerLetter.campaignId,
                chainId: offerLetter.chainId,
                clientId: clientOffer.clientId,
                offerId: offerLetterId,
                toOffer: clientOffer.id,
                transaction: t,
            });

            // Add the mail for the printer
            await offerPrintServices.addMail({
                poBoxId: offerLetter.returnAddressId,
                campaignId: offerLetter.campaignId,
                clientId: clientOffer.clientId,
                offerId: offerLetterId,
                offerCode: letterClientOffer.code,
                keyCodeId: letterClientOffer.keyCodeId,
                availableAt: new Date(),
                transaction: t,
            });

            // Generate the next offer in the chain and get the new offer for the orignal offer
            // const offerSequence = await OfferSequence.findByPk(
            //     clientOffer.currentSequenceId
            // );

            // await generateNextOffer(t, offerSequence, clientOffer);

            await t.commit();
            return true;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Takes the chain and the offer id and return the next offers with sequences ids for the passed chain starting from the passed offer id. it will add the passed offer id alongside with its sequence
     *
     * @param {string|number} offerId
     * @param {string|number} chainId
     * @returns {Promise<{offersIds: number[], sequencesIds: number[], indexMapper: Record<string|number, (number[] | string[])>}>}
     */
    async getNextOffers(offerId, chainId) {
        try {
            const sequences = await OfferSequence.findAll({
                where: {
                    currentOfferId: offerId,
                    chainId,
                },
                include: [
                    {
                        model: Offer,
                        as: "currentOffer",
                        attributes: ["id", "type"],
                    },
                ],
            });

            // Extract the next offers from the sequences
            // In case the offer was leading to nothing then it's the last offer in the chain. means clear these values
            // Index mapper to know which offer sequence belongs to :) [offerId]: [ seqId1, seqId2, ... ]
            let targetedOffers = {
                offersIds: [offerId],
                sequencesIds: [],
                indexMapper: {},
                productOfferIds: [],
            };

            sequences.forEach((offerSeq) => {
                if (
                    offerSeq.nextOfferId !== null &&
                    offerSeq.nextOfferId !== undefined
                ) {
                    // Save the offers IDs
                    targetedOffers.offersIds.push(offerSeq.nextOfferId);

                    // And the Sequences IDs
                    targetedOffers.sequencesIds.push(offerSeq.id);

                    // And the index mapper
                    if (
                        targetedOffers.indexMapper[offerSeq.currentOfferId] &&
                        !targetedOffers.indexMapper[
                            offerSeq.currentOfferId
                        ].includes(offerSeq.id)
                    ) {
                        targetedOffers.indexMapper[
                            offerSeq.currentOfferId
                        ].push(offerSeq.id);
                    } else {
                        targetedOffers.indexMapper[offerSeq.currentOfferId] = [
                            offerSeq.id,
                        ];
                    }

                    // Track product offers (non-offer types)
                    if (
                        offerSeq.currentOffer.type !== "offer" &&
                        !targetedOffers.productOfferIds.includes(
                            offerSeq.currentOfferId
                        )
                    ) {
                        targetedOffers.productOfferIds.push(
                            offerSeq.currentOfferId
                        );
                    }
                }
            });

            // Make it unique
            targetedOffers.offersIds = [...new Set(targetedOffers.offersIds)];
            targetedOffers.sequencesIds = [
                ...new Set(targetedOffers.sequencesIds),
            ];

            // Now get the offer sequence where is one of those offers is the current offer
            const openedSequences = await OfferSequence.findAll({
                where: {
                    currentOfferId: {
                        [Op.in]: targetedOffers.offersIds,
                    },
                    chainId,
                },
                include: [
                    {
                        model: Offer,
                        as: "currentOffer",
                        attributes: ["id", "type"],
                    },
                ],
            });

            // Move them inside the openedSequences array now
            openedSequences.map((rec) => {
                targetedOffers.sequencesIds.push(rec.id);

                if (
                    targetedOffers.indexMapper[rec.currentOfferId] &&
                    !targetedOffers.indexMapper[rec.currentOfferId].includes(
                        rec.id
                    )
                ) {
                    targetedOffers.indexMapper[rec.currentOfferId].push(rec.id);
                } else {
                    targetedOffers.indexMapper[rec.currentOfferId] = [rec.id];
                }

                // Track product offers (non-offer types)
                if (
                    rec.currentOffer &&
                    rec.currentOffer.type !== "offer" &&
                    !targetedOffers.productOfferIds.includes(rec.currentOfferId)
                ) {
                    targetedOffers.productOfferIds.push(rec.currentOfferId);
                }
            });

            // Clear again
            targetedOffers.sequencesIds = [
                ...new Set(targetedOffers.sequencesIds),
            ];

            console.log(
                "\n####### this is the product offers #########\n",
                targetedOffers.productOfferIds,
                "\n################\n"
            );

            // Return all of them one piece
            return targetedOffers;
        } catch (err) {
            throw err;
        }
    }

    // Use it by order module nothing else
    async _deleteMailFiles(filters, transaction = null) {
        try {
            const deletedCount = await ClientOffer.destroy({
                where: filters,
                ...(transaction ? { transaction } : {}),
            });

            if (!deletedCount) {
                throw new APIError(
                    "The mail files are either deleted or not found in the first place",
                    404,
                    "NOT_FOUND"
                );
            }

            return deletedCount;
        } catch (err) {
            throw err;
        }
    }

    // Use it by order module nothing else
    async _getMailFiles(filters, transaction = null) {
        try {
            const mailFiles = await ClientOffer.findAll({
                where: filters,
                ...(transaction ? { transaction } : {}),
            });

            if (!mailFiles.length) {
                throw new APIError(
                    "The mail files are either deleted or not found in the first place",
                    404,
                    "NOT_FOUND"
                );
            }

            return mailFiles;
        } catch (err) {
            throw err;
        }
    }
}

export default new OfferServices();
