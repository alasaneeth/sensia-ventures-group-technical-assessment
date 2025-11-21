import { Sequelize } from "sequelize";
import Offer from "../../offers/models/offer.js";
import KeyCodeDetails from "../models/keyCodeDetails.js";
import Campaign from "../models/campaign.js";
// import { getChainById } from "../../offers/services/chainServices.js";
import chainServices from "../../offers/services/chain.js";
import sequelize from "../../../config/sequelize.js";
import {
    filtersParser,
    rawSearchParser,
} from "../../../utils/filterParsers.js";
import Chain from "../../offers/models/chain.js";
import OfferSequence from "../../offers/models/offerSequence.js";
import CampaignOffer from "../models/campaignOffer.js";
import KeyCode from "../models/keyCode.js";
import APIError from "../../../utils/APIError.js";
import Brand from "../../companies/models/brand.js";
import Company from "../../companies/models/company.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

class KeyCodeServices {
    async getCampaignKeyCodes(campaignId) {
        try {
            const segmentations = await KeyCodeDetails.findAll({
                where: { campaignId: campaignId },
                attributes: {
                    include: [
                        // Unique clients for this key
                        [
                            Sequelize.literal(`
                        (SELECT COUNT(DISTINCT kc."clientId")
                        FROM "key_codes" kc
                        WHERE kc."keyId" = "KeyCodeDetails"."id")
                    `),
                            "clientCount",
                        ],

                        // OfferPrints exported / not exported
                        [
                            Sequelize.literal(`
                        (SELECT COUNT(*)
                        FROM "offer_prints" op
                        WHERE op."keyCodeId" = "KeyCodeDetails"."id"
                        AND op."isExported" = TRUE)
                    `),
                            "printedCount",
                        ],
                        [
                            Sequelize.literal(`
                        (SELECT COUNT(*)
                        FROM "offer_prints" op
                        WHERE op."keyCodeId" = "KeyCodeDetails"."id"
                        AND op."isExported" = FALSE)
                    `),
                            "notSentCount",
                        ],

                        // Orders + money (no double counting)
                        [
                            Sequelize.literal(`
                        (SELECT COUNT(*)
                        FROM "orders" o
                        WHERE o."keyCodeId" = "KeyCodeDetails"."id")
                    `),
                            "totalOrders",
                        ],
                        [
                            Sequelize.literal(`
                        COALESCE((
                        SELECT SUM(o."amount")
                        FROM "orders" o
                        WHERE o."keyCodeId" = "KeyCodeDetails"."id"
                        ), 0)
                    `),
                            "totalMoney",
                        ],
                    ],
                },
                include: [
                    {
                        model: Offer,
                        as: "offer",
                    },
                    {
                        model: KeyCodeDetails,
                        as: "fromSegment",
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
                // raw: true,
            });

            return segmentations;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get key codes for a campaign grouped by key with count and description
     * @param {number} campaignId - Campaign ID
     * @returns {Promise<Array>} Array of key codes with quantities and descriptions
     */
    async getCampaignKeyCodeCount(campaignId) {
        try {
            const keyCodes = await KeyCodeDetails.findAll({
                where: {
                    campaignId,
                },
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                            SELECT COUNT("campaignId") FROM key_codes
                            WHERE key_codes."keyId" = "KeyCodeDetails"."id"
                            AND key_codes."campaignId" = "KeyCodeDetails"."campaignId"
                        )`),
                            "quantity",
                        ],
                    ],
                },
            });

            return keyCodes;
        } catch (error) {
            console.error("Error getting key codes:", error);
            throw error;
        }
    }

    async upsertKeyCode(
        clientOffer, // Likely to be removed also
        campaignId,
        camapignCode,
        offerId,
        clientId,
        fromKeyCode, // To know where is the segemnt that we come from
        manipulateBy = 1, // Remove it this has no more usage
        transaction
    ) {
        try {
            // We in This case we need to create unknown segemnt if exists then attach to it if not create it
            // To not break the rules thier codes will be campaignCode$unknown#-1
            if (fromKeyCode === null) {
                const existsKeyCode = await KeyCodeDetails.findOne({
                    where: {
                        isUnknown: true, // Check for unknown segment with that offer and campaign
                        campaignId,
                        offerId,
                    },
                    ...(transaction ? { transaction } : {}),
                });

                // If exists return the code of it and check if the client is exists on this segemnt
                if (existsKeyCode) {
                    await KeyCode.upsert(
                        {
                            campaignId,
                            offerId,
                            clientId,
                            keyId: existsKeyCode.id,
                            isExtracted: true,
                        },
                        {
                            ...(transaction ? { transaction } : {}),
                            conflictFields: [
                                "keyId",
                                "offerId",
                                "campaignId",
                                "clientId",
                            ],
                        }
                    );

                    ////// Terminate here and return the segemnt id
                    return existsKeyCode.id;
                }

                ///// In case not exits create one and add the user to it. note if you got another one for the same offer and campaign this will not be reached.
                // Find the last unknown segment for this campaign to get the next number
                const lastKeyCode = await KeyCodeDetails.findOne({
                    attributes: [
                        [
                            Sequelize.literal(
                                "COALESCE(MIN((split_part(key, '#', 2))::INT), 0)"
                            ),
                            "minKeyNumber",
                        ],
                    ],
                    where: {
                        campaignId,
                        isUnknown: true,
                    },
                    ...(transaction ? { transaction } : {}),
                });

                // Get the minimum value and reduce it by one for unknown segments
                const baseNumber = lastKeyCode?.dataValues?.minKeyNumber
                    ? parseInt(lastKeyCode.dataValues.minKeyNumber) - 1
                    : -1;

                // Get campaign to derive brandId
                const campaign = await Campaign.findByPk(campaignId, {
                    attributes: ["id", "brandId"],
                    ...(transaction ? { transaction } : {}),
                });

                if (!campaign || !campaign.brandId) {
                    throw new APIError(
                        "Campaign not found or missing brandId",
                        404,
                        "CAMPAIGN_OR_BRAND_NOT_FOUND"
                    );
                }

                const keyCode = await KeyCodeDetails.create(
                    {
                        campaignId,
                        offerId,
                        brandId: campaign.brandId,
                        key: `${camapignCode}$unknown#${baseNumber}`,
                        isUnknown: true, // Mark it as unknown. To be able to optimize it better later
                        fromSegmentId: null,
                    },
                    { ...(transaction ? { transaction } : {}) }
                );

                // Create the record for that client
                await KeyCode.create(
                    {
                        campaignId,
                        offerId,
                        clientId,
                        keyId: keyCode.id,
                        isExtracted: true,
                    },
                    { ...(transaction ? { transaction } : {}) }
                );

                return keyCode.id;
            }

            ///////////////////////// Here we made sure that we know excatly that offer where does it come from
            ///// What we know that they are running after each other in a row
            // for the unknown they will be -1, -2, -3, -4
            /// for the known they will be 1, 2, 3, 4, 5

            // So we gonna check if we created the next segment depending on the previous one
            // for each offer and previous segment id

            // Check if there is an existing one. we gonna extract the data from it
            const prevKeyCode = await KeyCodeDetails.findByPk(fromKeyCode, {
                ...(transaction ? { transaction } : {}),
            });

            // This line will not be reached in case the segment is not found
            // Because this operation done once pretty much like client offer
            // we create it once. mark it as isExtracted and then call it a day
            // If this code reached here and your client with offer id and the campaign
            // id is the same and created new segment for excat the same information
            // make sure you have called this function in a wrong place

            let finalKeyId = null;

            // For unknown segments, don't track lineage - just follow the original logic
            if (prevKeyCode.isUnknown) {
                // For unknown segments, find the first one by offer ID and campaign ID with isUnknown=true
                const existingUnknownKeyCode = await KeyCodeDetails.findOne({
                    where: {
                        campaignId,
                        offerId,
                        isUnknown: true,
                    },
                    ...(transaction ? { transaction } : {}),
                });

                let finalKeyCode;
                if (existingUnknownKeyCode) {
                    // If exists, use it
                    finalKeyId = existingUnknownKeyCode.id;
                } else {
                    // If not, create a new unknown segment
                    // Generate a key using the campaign code and a sequential negative number
                    const lastKeyCode = await KeyCodeDetails.findOne({
                        attributes: [
                            [
                                Sequelize.literal(
                                    "COALESCE(MIN((split_part(key, '#', 2))::INT), 0)"
                                ),
                                "minKeyNumber",
                            ],
                        ],
                        where: {
                            campaignId,
                            isUnknown: true,
                        },
                        ...(transaction ? { transaction } : {}),
                    });

                    // Get the minimum value and reduce it by one for unknown segments
                    const baseNumber = lastKeyCode?.dataValues?.minKeyNumber
                        ? parseInt(lastKeyCode.dataValues.minKeyNumber) - 1
                        : -1;

                    // Get campaign to derive brandId
                    const campaignForUnknown = await Campaign.findByPk(
                        campaignId,
                        {
                            attributes: ["id", "brandId"],
                            ...(transaction ? { transaction } : {}),
                        }
                    );

                    if (!campaignForUnknown || !campaignForUnknown.brandId) {
                        throw new APIError(
                            "Campaign not found or missing brandId",
                            404,
                            "CAMPAIGN_OR_BRAND_NOT_FOUND"
                        );
                    }

                    // Create new key code without tracking lineage for unknown segments
                    finalKeyCode = await KeyCodeDetails.create(
                        {
                            offerId,
                            campaignId,
                            brandId: campaignForUnknown.brandId,
                            description: "", // Preserve description from source segment
                            filters: "", // Preserve filters from source segment
                            key: `${camapignCode}$unknown#${baseNumber}`,
                            listName: "", // Preserve listName from source segment (segment identifier)
                            isUnknown: true,
                            fromSegmentId: null,
                            // No fromSegmentId for unknown segments
                        },
                        { ...(transaction ? { transaction } : {}) }
                    );
                    finalKeyId = finalKeyCode.id;
                }

                // Create the relation between client and key code
                await KeyCode.upsert(
                    {
                        campaignId,
                        offerId,
                        clientId,
                        keyId: finalKeyId,
                        isExtracted: true,
                    },
                    {
                        ...(transaction ? { transaction } : {}),
                        conflictFields: [
                            "keyId",
                            "offerId",
                            "campaignId",
                            "clientId",
                        ],
                    }
                );

                // Terminate here for unknown segments
                return finalKeyId;
            }

            // For known segments, first check if there's already a segment created from the same source
            const existingFromSameSource = await KeyCodeDetails.findOne({
                where: {
                    campaignId,
                    offerId,
                    fromSegmentId: prevKeyCode.id,
                },
                ...(transaction ? { transaction } : {}),
            });

            // If we found a segment that was already created from the same source, use it
            if (existingFromSameSource) {
                finalKeyId = existingFromSameSource.id;

                // Create the relation between client and key code if it doesn't exist
                await KeyCode.upsert(
                    {
                        campaignId,
                        offerId,
                        clientId,
                        keyId: finalKeyId,
                        isExtracted: true,
                    },
                    {
                        ...(transaction ? { transaction } : {}),
                        conflictFields: [
                            "keyId",
                            "offerId",
                            "campaignId",
                            "clientId",
                        ],
                    }
                );

                // Return the existing key ID
                return finalKeyId;
            }

            // If no segment from same source, query by campaign ID and offer ID only
            // We don't filter by listName since it appears to be used for other purposes in the database
            const existingKnownKeyCode = await KeyCodeDetails.findOne({
                where: {
                    campaignId,
                    offerId,
                    isUnknown: false,
                    fromSegmentId: prevKeyCode.id,
                },
                ...(transaction ? { transaction } : {}),
            });

            let finalKeyCode;
            if (existingKnownKeyCode) {
                // If exists, use it
                finalKeyId = existingKnownKeyCode.id;
            } else {
                // If not, create a new known segment
                // Generate a key using the campaign code and a sequential number
                const lastKeyCode = await KeyCodeDetails.findOne({
                    attributes: [
                        [
                            Sequelize.literal(
                                "COALESCE(MAX((split_part(key, '#', 2))::INT), 0)"
                            ),
                            "maxKeyNumber",
                        ],
                    ],
                    where: {
                        campaignId,
                        isUnknown: false,
                    },
                    ...(transaction ? { transaction } : {}),
                });

                const baseNumber = lastKeyCode?.dataValues?.maxKeyNumber
                    ? parseInt(lastKeyCode.dataValues.maxKeyNumber) + 1
                    : 1;

                // Get campaign to derive brandId
                const campaignForKnown = await Campaign.findByPk(campaignId, {
                    attributes: ["id", "brandId"],
                    ...(transaction ? { transaction } : {}),
                });

                // This condition is .... delete it when you have time
                if (!campaignForKnown || !campaignForKnown.brandId) {
                    throw new APIError(
                        "Campaign not found or missing brandId",
                        404,
                        "CAMPAIGN_OR_BRAND_NOT_FOUND"
                    );
                }

                // Create new key code with fromSegmentId to track the source for known segments
                finalKeyCode = await KeyCodeDetails.create(
                    {
                        offerId,
                        campaignId,
                        brandId: campaignForKnown.brandId,
                        description: prevKeyCode.description, // Preserve description from source segment
                        filters: "", // Preserve filters from source segment
                        key: `${camapignCode}#${baseNumber}`,
                        listName: prevKeyCode.listName, // Preserve listName from source segment (seems to be segment identifier)
                        fromSegmentId: prevKeyCode.id, // Store the source segment ID for known segments
                    },
                    { ...(transaction ? { transaction } : {}) }
                );
                finalKeyId = finalKeyCode.id;
            }

            // Create the relation between client and key code
            await KeyCode.upsert(
                {
                    campaignId,
                    offerId,
                    clientId,
                    keyId: finalKeyId,
                    isExtracted: true,
                },
                {
                    ...(transaction ? { transaction } : {}),
                    conflictFields: [
                        "keyId",
                        "offerId",
                        "campaignId",
                        "clientId",
                    ],
                }
            );

            return finalKeyId;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Create key code
     * @param {Array|null} clients - Array of client objects with id or null for filter-based enrollment
     * @param {number} campaignId - ID of the campaign
     * @param {Object} filters - Filter object for filter-based enrollment (optional)
     * @returns {Promise<Object>} - Promise with enrollment result
     */
    async createKeyCode(
        campaignId,
        offerId,
        filters = null,
        keyCodeDescription = null,
        listName
    ) {
        try {
            // Get campaign with chain data
            const campaign = await Campaign.findByPk(campaignId);

            // Validate campaign exists
            if (!campaign) {
                throw new APIError(
                    "Campaign not found",
                    404,
                    "CAMPAIGN_NOT_FOUND"
                );
            }

            // Get chain associated with campaign
            if (!campaign.chainId) {
                throw new APIError(
                    "Campaign does not have an associated chain",
                    400,
                    "NO_CHAIN_ASSOCIATED"
                );
            }

            // Get chain with its offer_sequence. it exists inside chainNodes
            const chain = await chainServices.getChainById(campaign.chainId);

            // Validate chain exists
            if (!chain) {
                throw new APIError("Chain not found", 404, "CHAIN_NOT_FOUND");
            }

            // Get the first sequence from the chain
            if (!chain.offerSequenceId) {
                throw new APIError(
                    "Chain does not have a first sequence",
                    400,
                    "NO_FIRST_SEQUENCE_FOUND"
                );
            }

            // Filter-based segmentation - query clients based on filters
            // Parse date filters from mm/dd/yyyy to Date object
            // if (filters?.lastPurchaseDate && Array.isArray(filters.lastPurchaseDate)) {
            //     filters.lastPurchaseDate = filters.lastPurchaseDate.map((dateFilter) => {
            //         const opKey = Object.keys(dateFilter)[0];
            //         const dateStr = dateFilter[opKey];
            //         // Parse mm/dd/yyyy to Date without timezone shifting
            //         const parsed = dayjs.utc(dateStr, "MM/DD/YYYY");
            //         const dateObj = parsed.toDate();
            //         return { [opKey]: dateObj };
            //     });
            // }

            // Build the WHERE clause dynamically based on filters
            let { filterConditions, replacements: gotReplacements } =
                rawSearchParser(filters);

            // Define computed metric expressions for raw SQL
            const metricExprs = {
                totalOrders: `COALESCE((SELECT COUNT(o."amount") FROM "orders" o WHERE o."clientId" = "clients"."id"), 0) + COALESCE("clients"."totalOrders", 0)`,
                totalMails: `COALESCE((SELECT COUNT(op."clientId") FROM "offer_prints" op WHERE op."clientId" = "clients"."id" AND op."isExported" = true), 0) + COALESCE("clients"."totalMails", 0)`,
                totalAmount: `COALESCE((SELECT SUM(o."amount") FROM "orders" o WHERE o."clientId" = "clients"."id"), 0) + COALESCE("clients"."totalAmount", 0)`,
            };

            // Replace metric column references with computed expressions via string manipulation
            filterConditions = filterConditions.map((condition) => {
                let updatedCondition = condition;
                ["totalOrders", "totalMails", "totalAmount"].forEach((key) => {
                    // Replace "columnName" with (computed expression)
                    updatedCondition = updatedCondition.replace(
                        new RegExp(`"${key}"`, "g"),
                        `(${metricExprs[key]})`
                    );
                });
                return updatedCondition;
            });

            // Use unmanaged transaction
            const t = await sequelize.transaction();

            try {
                const lastKeyCode = await KeyCodeDetails.findOne({
                    attributes: [
                        [
                            Sequelize.literal(
                                "COALESCE(MAX((split_part(key, '#', 2))::INT), 0)"
                            ),
                            "maxKeyNumber",
                        ],
                    ],
                    where: { campaignId },
                });

                // The code must end with special ending and they must be unique
                // So get the base number from the end

                // the campaign will have a unique key code
                let base = lastKeyCode.dataValues.maxKeyNumber + 1;

                ////////////   Use upsertKeyCode in the future

                let results = [];
                // Take the first offer to create a segmentaion for it
                // Create new key code details
                let keyCodeDetailsRecord = await KeyCodeDetails.create(
                    {
                        offerId: chain.firstOffer,
                        campaignId: campaignId,
                        brandId: campaign.brandId, // Set brandId from campaign
                        description: keyCodeDescription,
                        filters,
                        key: `${campaign.code}#${base++}`,
                        listName,
                    },
                    { transaction: t }
                );

                // Extract the actual key value to use as keyId
                const keyIdValue = keyCodeDetailsRecord
                    ? keyCodeDetailsRecord.id
                    : null;

                // For each key code extract the neccessary informations
                // for (let i = 0; i < keyCodes.length; i++) {
                // Extract the key code object model
                // const keyCode = keyCodes[i];

                let replacements = {
                    campaignId: campaignId,
                    keyId: keyIdValue,
                    offerId: chain.firstOffer,
                    ...gotReplacements,
                };

                // Build query to insert only into key_codes table
                // Filter by key_codes instead of client_offers
                const insertQuery = `
                        INSERT INTO key_codes ("keyId", "campaignId", "clientId", "offerId")
                        SELECT
                            :keyId,
                            :campaignId,
                            id,
                            :offerId
                        FROM clients
                        WHERE id NOT IN (
                            SELECT DISTINCT "clientId"
                            FROM key_codes
                            WHERE "campaignId" = :campaignId AND "offerId" = :offerId
                        )
                        ${
                            filterConditions.length > 0
                                ? " AND " + filterConditions.join(" AND ")
                                : ""
                        }
                        RETURNING "clientId"
                    `;

                // Execute the insert query
                [results] = await sequelize.query(insertQuery, {
                    replacements,
                    type: sequelize.QueryTypes.INSERT,
                    transaction: t,
                });
                // }

                // Commit transaction
                await t.commit();

                // Get the number of inserted rows
                const enrolledCount = results?.length || 0;

                return {
                    message: `Successfully segmented ${enrolledCount}`,
                };
            } catch (error) {
                await t.rollback();
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Extract segmented clients to campaign (create client_offers and offer_prints)
     * @param {number} campaignId - Campaign ID
     * @returns {Promise<Object>} - Extraction result
     */
    async extractSegmentedClients(campaignId) {
        try {
            // Validate campaignId
            if (!campaignId) {
                throw new APIError(
                    "Campaign ID is required",
                    400,
                    "CAMPAIGN_ID_REQUIRED"
                );
            }

            // Get campaign with chain data
            const campaign = await Campaign.findByPk(campaignId);

            // Get the brand Id, and mail date to inject them in the query
            const brandId = campaign.brandId;

            if (!campaign) {
                throw new APIError(
                    "Campaign not found",
                    404,
                    "CAMPAIGN_NOT_FOUND"
                );
            }

            if (!campaign.chainId) {
                throw new APIError(
                    "Campaign does not have an associated chain",
                    400,
                    "NO_CHAIN_ASSOCIATED"
                );
            }

            // Get chain with its offer_sequence
            const chain = await Chain.findByPk(campaign.chainId);

            if (!chain) {
                throw new APIError("Chain not found", 404, "CHAIN_NOT_FOUND");
            }

            if (!chain.offerSequenceId) {
                throw new APIError(
                    "Chain does not have a first sequence",
                    400,
                    "NO_FIRST_SEQUENCE_FOUND"
                );
            }

            // const availableDate = campaign.mailDate || new Date();
            const currentTimestamp = new Date();

            // From this you can access many things
            const offerSequence = await OfferSequence.findByPk(
                chain.offerSequenceId,
                {
                    include: [
                        {
                            model: Offer,
                            as: "currentOffer",
                            include: [
                                {
                                    // Only get the IDs
                                    model: CampaignOffer,
                                    as: "offerCampaigns",
                                    where: {
                                        campaignId: campaignId,
                                    },
                                },
                            ],
                        },
                    ],
                }
            );

            // To be able to activate only for the segment where it contains the first offer only
            const firstOfferId = offerSequence.currentOfferId;

            // Use unmanaged transaction
            const t = await sequelize.transaction();

            // Use joins on the future better for performance

            try {
                // Build CTE query to extract clients
                const extractQuery = `
                WITH unextracted_keys AS (
                    -- Get all key_code_details for this campaign
                    SELECT id
                    FROM key_code_details kcd
                    WHERE kcd."id" IN (
                        SELECT DISTINCT kc."keyId"
                        FROM key_codes kc
                        WHERE kc."keyId" = kcd."id"
                    )
                    AND kcd."campaignId" = :campaignId
                    AND kcd."offerId" = :firstOfferId
                ),

                eligible_clients AS (
                    -- Get all client IDs from key_codes that are not yet extracted
                    SELECT DISTINCT kc."clientId", kc."keyId", kc."campaignId"
                    FROM key_codes kc
                    INNER JOIN unextracted_keys uk ON uk."id" = kc."keyId"
                    WHERE kc."campaignId" = :campaignId
                    AND kc."isExtracted" = false
                ),

                mail_date AS (
                    SELECT "mailDate" FROM campaigns WHERE id = :campaignId
                ),

                inserted_offers AS (
                    -- Insert into client_offers
                    INSERT INTO client_offers ("campaignId", "currentSequenceId", "availableAt", "chainId", "keyCodeId", "clientId", "brandId", "createdAt", "updatedAt")
                    SELECT
                        :campaignId,
                        :currentSequenceId,
                        (SELECT "mailDate" FROM mail_date),
                        :chainId,
                        ec."keyId",
                        ec."clientId",
                        :brandId,
                        :createdAt,
                        :updatedAt
                    FROM eligible_clients ec
                    RETURNING "clientId", "code", "availableAt", "currentSequenceId", "keyCodeId"
                ),
                inserted_prints AS (
                    -- Insert into offer_prints
                    INSERT INTO offer_prints ("clientId", "offerId", "offerCode", "availableAt", "campaignId", "keyCodeId", "brandId", "createdAt", "updatedAt")
                    SELECT
                        io."clientId",
                        os."currentOfferId",
                        io."code",
                        (SELECT "mailDate" FROM mail_date),
                        :campaignId,
                        io."keyCodeId",
                        :brandId,
                        :createdAt,
                        :updatedAt
                    FROM inserted_offers io
                    JOIN offer_sequences os ON os.id = io."currentSequenceId"
                    RETURNING "clientId"
                )
                -- Mark key_codes as extracted
                UPDATE key_codes
                SET "isExtracted" = true
                WHERE "clientId" IN (SELECT "clientId" FROM eligible_clients)
                    AND "campaignId" = :campaignId
                    AND "isExtracted" = false
                RETURNING "clientId"
            `;

                const replacements = {
                    campaignId: campaignId,
                    currentSequenceId: chain.offerSequenceId,
                    // availableAt: availableDate,
                    chainId: chain.id,
                    createdAt: currentTimestamp,
                    updatedAt: currentTimestamp,
                    firstOfferId,
                    brandId, // Send it to print records, and client offers (mail files)
                    // returnAddress: campaign.mainPoBoxId, // first offer take it from the main plan
                };

                // Execute the CTE query
                const [results] = await sequelize.query(extractQuery, {
                    replacements,
                    type: sequelize.QueryTypes.UPDATE,
                    transaction: t,
                });

                // Check if all segemnation contains all the clients for this campaing. if yes mark it as extracted to not show it later
                // const checkQuery = `
                //     SELECT "totalExported" = "totalClients" AS "isDone" FROM (
                //         SELECT COUNT(*) FROM key_codes
                //         WHERE "isExtracted" = TRUE
                //         AND "campaignId" = :campaignId
                //     ) AS "totalExported",
                //     (
                //         SELECT COUNT(*) FROM clients
                //         WHERE country = :country
                //         AND "isBlacklisted" = FALSE
                //     ) AS "totalClients"
                // `;

                ////// It will be done directly
                // const [isDone] = await sequelize.query(checkQuery, {
                //     replacements: {
                //         country: campaign.country,
                //         campaignId: campaign.id,
                //     },
                //     type: sequelize.QueryTypes.SELECT,
                //     transaction: t,
                // });

                // If done mark the campaign as extracted
                // if (isDone.isDone) {
                await campaign.update(
                    { isExtracted: true },
                    { transaction: t }
                );
                // }

                // Get the number of extracted clients
                const extractedCount = results?.length || 0;

                // Commit transaction
                await t.commit();

                return {
                    message: `Successfully extracted ${extractedCount} clients to campaign.`,
                    count: extractedCount,
                };
            } catch (error) {
                await t.rollback();
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }

    async getKeyCodesDetails({
        offset = 0,
        limit = 10,
        filters,
        sortField,
        sortDirection,
        takeLimitAndOffset = true,
    }) {
        try {
            let whereClause = {};
            let order = [["id", "DESC"]];

            if (filters) {
                whereClause = filtersParser(filters);
            }

            if (sortField && sortDirection) {
                order.push([sortField, sortDirection]);
            }

            const { rows: keyCodes, count } =
                await KeyCodeDetails.findAndCountAll({
                    include: [
                        {
                            model: Campaign,
                            as: "campaign",
                        },
                        {
                            model: Brand,
                            as: "brand",
                            include: [
                                {
                                    model: Company,
                                    as: "company",
                                },
                            ],
                        },
                    ],
                    distinct: true,
                    where: whereClause,
                    ...(takeLimitAndOffset ? { offset, limit } : {}),
                    order: order,
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);

            return {
                data: keyCodes,
                pagination: {
                    total: count,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Fetches key codes with optional filtering, sorting, and pagination.
     *
     * @param {Object} params
     * @param {number} [params.offset=0] - Cursor for pagination; ignored when {@link params.takeLimitAndOffset} is false.
     * @param {number} [params.limit=10] - Maximum number of records to return; ignored when {@link params.takeLimitAndOffset} is false.
     * @param {Object} [params.filters] - Filter definition passed to {@link filtersParser} to build the `where` clause.
     * @param {string} [params.sortField] - Column name to sort by, appended after the default `id DESC` ordering.
     * @param {"ASC"|"DESC"} [params.sortDirection] - Sort direction applied with {@link params.sortField} when both are provided.
     * @param {boolean} [params.takeLimitAndOffset=true] - When false, removes the `limit` and `offset` clauses so all matches are returned.
     * @returns {Promise<{data: KeyCode[], pagination: {total: number, pages: number, page: number, limit: number}}>} Paginated key code list.
     */
    async getKeyCodes({
        offset = 0,
        limit = 10,
        filters,
        sortField,
        sortDirection,
        takeLimitAndOffset = true,
    }) {
        try {
            let whereClause = {};
            let order = [["id", "DESC"]];

            if (filters) {
                whereClause = filtersParser(filters);
            }

            if (sortField && sortDirection) {
                order.push([sortField, sortDirection]);
            }

            const { rows: keyCodes, count } = await KeyCode.findAndCountAll({
                include: [
                    {
                        model: KeyCodeDetails,
                        as: "key",
                    },
                ],
                distinct: true,
                where: whereClause,
                ...(takeLimitAndOffset ? { offset, limit } : {}),
                order: order,
            });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);

            return {
                data: keyCodes,
                pagination: {
                    total: count,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    // Use it only for orders module
    async removeUsersFromSegments(id, t) {
        try {
            const deletedCount = await KeyCode.destroy({
                where: {
                    id
                },
                ...(t ? { transaction: t } : {})
            });

            if(!deletedCount) {
                throw new APIError("The key code for that client isn't found or it's already deleted", 404, "KEY_CODE_NOT_FOUND")
            }

            return deletedCount
        } catch (err) {
            throw err
        }
    }
}

export default new KeyCodeServices();
