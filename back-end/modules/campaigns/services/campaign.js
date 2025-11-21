import Campaign from "../models/campaign.js";
import Chain from "../../offers/models/chain.js";
import { Op, Sequelize } from "sequelize";
import Offer from "../../offers/models/offer.js";
import APIError from "../../../utils/APIError.js";
import sequelize from "../../../config/sequelize.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import CampaignOffer from "../models/campaignOffer.js";
import OfferSequence from "../../offers/models/offerSequence.js";
import dayjs from "dayjs";
import PayeeName from "../../settings/models/payeeName.js";

import Brand from "../../companies/models/brand.js";
import Company from "../../companies/models/company.js";
import BundleSku from "../../products/models/bundleSku.js";

class CampaignServices {
    async deleteCampaign(id) {
        try {
            const deletedCampaign = await Campaign.destroy({ where: { id } });

            if (!deletedCampaign) {
                throw new APIError(
                    "Campaign not found or already deleted",
                    400,
                    "NOT_FOUND"
                );
            }
            return deletedCampaign;
        } catch (err) {
            throw err;
        }
    }

    async getCampaignById(campaignId, exists = false, include = false) {
        try {
            console.log(
                "\n################\n",
                "Do you think that I'm exists ? ",
                include,
                "\n################\n"
            );
            let campaign = null;

            if (exists && typeof campaignId === "object") {
                campaign = campaignId;
            } else {
                campaign = await Campaign.findByPk(campaignId, {
                    attributes: {
                        ...(include
                            ? {
                                  include: [
                                      [
                                          Sequelize.literal(`(
                            WITH chain_offers AS (
                                SELECT
                                    co."offerId",
                                    co."index",
                                    o."title" as "offerTitle"
                                FROM chain_offers co
                                JOIN offers o ON co."offerId" = o."id"
                                JOIN chains c ON co."chainId" = c."id"
                                WHERE c."id" = "Campaign"."chainId"
                                ORDER BY co."index" ASC
                            ),
                            campaign_offer_data AS (
                                SELECT 
                                    cam_off."offerId",
                                    cam_off."printer",
                                    cam_off."currency",
                                    cam_off."printingPrice",
                                    cam_off."listPrice",
                                    cam_off."physicalItemPrice",
                                    cam_off."lettershopPrice",
                                    cam_off."uniqueDPPrice",
                                    cam_off."uniqueMiscPrice",
                                    cam_off."postagePrice",
                                    cam_off."purchasePrice",
                                    cam_off."payeeNameId",
                                    cam_off."returnAddressId",
                                    pn."name" as "payeeName",
                                    addr."address" as "returnAddress",
                                    addr."country" as "returnAddressCountry"
                                FROM campaign_offers cam_off
                                LEFT JOIN payee_names pn ON cam_off."payeeNameId" = pn."id"
                                LEFT JOIN addresses addr ON cam_off."returnAddressId" = addr."id"
                                WHERE cam_off."campaignId" = "Campaign"."id"
                            ),
                            print_stats AS (
                                SELECT
                                    op."offerId",
                                    SUM(CASE WHEN op."isExported" = true THEN 1 ELSE 0 END) as "mailsQuantity",
                                    SUM(CASE WHEN op."isExported" = false THEN 1 ELSE 0 END) as "notMailedYet"
                                FROM offer_prints op
                                WHERE op."campaignId" = "Campaign"."id"
                                GROUP BY op."offerId"
                            ),
                            order_stats AS (
                                SELECT
                                    o."offerId",
                                    COUNT(o."id") as "totalOrders",
                                    SUM(o."amount" - o."discountAmount") as "totalAmountAfterDiscount"
                                FROM orders o
                                WHERE o."campaignId" = "Campaign"."id"
                                GROUP BY o."offerId"
                            ),
                            skus AS (
                                SELECT sk.*, o.id AS "offerId" from offers o
                                JOIN campaign_offers cam_off ON cam_off."campaignId" = "Campaign".id
                                JOIN sku_offers sk_of ON sk_of."offerId" = o.id
                                JOIN bundle_skus sk ON sk."id" = sk_of."bundleSkuId"
                            )
                            
                            SELECT json_agg(
                                CASE 
                                    WHEN co."index" = 1 THEN json_build_object(
                                        'offerId', co."offerId",
                                        'offerTitle', co."offerTitle",
                                        'index', co."index",
                                        'printer', COALESCE(cod."printer", ''),
                                        'payeeNameId', COALESCE(cod."payeeNameId", null),
                                        'payeeName', COALESCE(cod."payeeName", ''),
                                        'returnAddressId', COALESCE(cod."returnAddressId", null),
                                        'returnAddress', COALESCE(cod."returnAddress", ''),
                                        'returnAddressCountry', COALESCE(cod."returnAddressCountry", ''),
                                        'currency', COALESCE(cod."currency", '$'),
                                        'printingPrice', COALESCE(cod."printingPrice", 0),
                                        'listPrice', COALESCE(cod."listPrice", 0),
                                        'physicalItemPrice', COALESCE(cod."physicalItemPrice", 0),
                                        'lettershopPrice', COALESCE(cod."lettershopPrice", 0),
                                        'uniqueDPPrice', COALESCE(cod."uniqueDPPrice", 0),
                                        'uniqueMiscPrice', COALESCE(cod."uniqueMiscPrice", 0),
                                        'postagePrice', COALESCE(cod."postagePrice", 0),
                                        'purchasePrice', COALESCE(cod."purchasePrice", 0),
                                        'printingTotalPrice', COALESCE(cod."printingPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'listTotalPrice', COALESCE(cod."listPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'physicalItemTotalPrice', COALESCE(cod."physicalItemPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'lettershopTotalPrice', COALESCE(cod."lettershopPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'uniqueDPTotalPrice', COALESCE(cod."uniqueDPPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'uniqueMiscTotalPrice', COALESCE(cod."uniqueMiscPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'postageTotalPrice', COALESCE(cod."postagePrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'totalMailFixCost', (COALESCE(cod."printingPrice", 0) + COALESCE(cod."listPrice", 0) + COALESCE(cod."physicalItemPrice", 0) + COALESCE(cod."lettershopPrice", 0) + COALESCE(cod."uniqueDPPrice", 0) + COALESCE(cod."uniqueMiscPrice", 0) + COALESCE(cod."postagePrice", 0)) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'turnover', COALESCE(cod."purchasePrice", 0) * COALESCE(os."totalOrders", 0),
                                        'ROR', CASE WHEN CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END > 0 THEN COALESCE(os."totalOrders", 0)::DECIMAL / CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END ELSE 0 END,
                                        'profitLoss', (COALESCE(cod."purchasePrice", 0) * COALESCE(os."totalOrders", 0)) - ((COALESCE(cod."printingPrice", 0) + COALESCE(cod."listPrice", 0) + COALESCE(cod."physicalItemPrice", 0) + COALESCE(cod."lettershopPrice", 0) + COALESCE(cod."uniqueDPPrice", 0) + COALESCE(cod."uniqueMiscPrice", 0) + COALESCE(cod."postagePrice", 0)) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END),
                                        'mailsQuantity', COALESCE(ps."mailsQuantity", 0) + COALESCE("Campaign"."mailQuantity", 0),
                                        'notMailedYet', COALESCE(ps."notMailedYet", 0),
                                        'totalOrders', COALESCE(os."totalOrders", 0),
                                        'totalAmountAfterDiscount', COALESCE(os."totalAmountAfterDiscount", 0),
                                        'skus', (
                                            SELECT ARRAY_AGG(DISTINCT sk)
                                            FROM skus sk
                                            WHERE sk."offerId" = co."offerId"
                                        )
                                    )
                                    ELSE json_build_object(
                                        'offerId', co."offerId",
                                        'offerTitle', co."offerTitle",
                                        'index', co."index",
                                        'printer', COALESCE(cod."printer", ''),
                                        'payeeNameId', COALESCE(cod."payeeNameId", null),
                                        'payeeName', COALESCE(cod."payeeName", ''),
                                        'returnAddressId', COALESCE(cod."returnAddressId", null),
                                        'returnAddress', COALESCE(cod."returnAddress", ''),
                                        'returnAddressCountry', COALESCE(cod."returnAddressCountry", ''),
                                        'currency', COALESCE(cod."currency", '$'),
                                        'printingPrice', COALESCE(cod."printingPrice", 0),
                                        'listPrice', COALESCE(cod."listPrice", 0),
                                        'physicalItemPrice', COALESCE(cod."physicalItemPrice", 0),
                                        'lettershopPrice', COALESCE(cod."lettershopPrice", 0),
                                        'uniqueDPPrice', COALESCE(cod."uniqueDPPrice", 0),
                                        'uniqueMiscPrice', COALESCE(cod."uniqueMiscPrice", 0),
                                        'postagePrice', COALESCE(cod."postagePrice", 0),
                                        'purchasePrice', COALESCE(cod."purchasePrice", 0),
                                        'printingTotalPrice', COALESCE(cod."printingPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'listTotalPrice', COALESCE(cod."listPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'physicalItemTotalPrice', COALESCE(cod."physicalItemPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'lettershopTotalPrice', COALESCE(cod."lettershopPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'uniqueDPTotalPrice', COALESCE(cod."uniqueDPPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'uniqueMiscTotalPrice', COALESCE(cod."uniqueMiscPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'postageTotalPrice', COALESCE(cod."postagePrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'totalMailFixCost', (COALESCE(cod."printingPrice", 0) + COALESCE(cod."listPrice", 0) + COALESCE(cod."physicalItemPrice", 0) + COALESCE(cod."lettershopPrice", 0) + COALESCE(cod."uniqueDPPrice", 0) + COALESCE(cod."uniqueMiscPrice", 0) + COALESCE(cod."postagePrice", 0)) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                        'turnover', COALESCE(cod."purchasePrice", 0) * COALESCE(os."totalOrders", 0),
                                        'ROR', CASE WHEN CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END > 0 THEN COALESCE(os."totalOrders", 0)::DECIMAL / CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END ELSE 0 END,
                                        'profitLoss', (COALESCE(cod."purchasePrice", 0) * COALESCE(os."totalOrders", 0)) - ((COALESCE(cod."printingPrice", 0) + COALESCE(cod."listPrice", 0) + COALESCE(cod."physicalItemPrice", 0) + COALESCE(cod."lettershopPrice", 0) + COALESCE(cod."uniqueDPPrice", 0) + COALESCE(cod."uniqueMiscPrice", 0) + COALESCE(cod."postagePrice", 0)) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END),
                                        'mailsQuantity', COALESCE(ps."mailsQuantity", 0),
                                        'notMailedYet', COALESCE(ps."notMailedYet", 0),
                                        'totalOrders', COALESCE(os."totalOrders", 0),
                                        'totalAmountAfterDiscount', COALESCE(os."totalAmountAfterDiscount", 0),
                                        'skus', (
                                            SELECT ARRAY_AGG(DISTINCT sk)
                                            FROM skus sk
                                            WHERE sk."offerId" = co."offerId"
                                        )
                                    )
                                END
                                ORDER BY co."index" ASC
                            )
                            FROM chain_offers co
                            LEFT JOIN campaign_offer_data cod ON co."offerId" = cod."offerId"
                            LEFT JOIN print_stats ps ON co."offerId" = ps."offerId"
                            LEFT JOIN order_stats os ON co."offerId" = os."offerId"
                        )`),
                                          "chainOffers",
                                      ],
                                  ],
                              }
                            : {}),
                    },
                    include: [
                        {
                            model: Chain,
                            as: "chain",
                            attributes: ["id", "title"],
                        },
                        {
                            model: Offer,
                            through: {
                                // Include all CampaignOffer attributes
                                attributes: [],
                            },
                            as: "offers",
                            include: [
                                {
                                    model: BundleSku,
                                    as: "skus",
                                    through: {
                                        attributes: [],
                                    },
                                },
                            ],
                        },
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

                if (!campaign) {
                    throw new APIError(
                        "Campaign not found",
                        404,
                        "CAMPAIGN_NOT_FOUND"
                    );
                }
            }

            // Parse chainOffers JSON if it exists
            if (!campaign.dataValues.chainOffers) {
                campaign.dataValues.chainOffers = [];
            }

            return campaign;
        } catch (error) {
            throw error;
        }
    }

    async updateCampaign(values, id, offers = null) {
        const transaction = await sequelize.transaction();

        try {
            // Get the orignal chain and compare in case he chande the chain we need to delete the old values from campaign offers
            const orignalCampaign = await Campaign.findByPk(id);
            if (
                values?.chainId &&
                orignalCampaign.chainId &&
                orignalCampaign.chainId !== values.chainId
            ) {
                // Delete with passing the transaction
                await CampaignOffer.destroy({
                    where: {
                        campaignId: id,
                    },
                    transaction: transaction,
                });
                // Add the campaign id to the offers
                const finalOffers = offers.map((offer) => {
                    let offerData = {
                        offerId: offer.id,
                        campaignId: id,
                    };

                    // Remove the id from offerData
                    delete offer.id;

                    return {
                        ...offerData,
                        ...offer.obj,
                    };
                });

                await CampaignOffer.bulkCreate(finalOffers, { transaction });

                const [affected] = await Campaign.update(values, {
                    where: { id },
                    transaction,
                });

                await transaction.commit();

                return affected;
            }

            // Update campaign basic info
            const [affected] = await Campaign.update(values, {
                where: { id },
                transaction,
            });

            // Update campaign offers if provided
            if (offers && Array.isArray(offers) && offers.length > 0) {
                // Process each offer update
                for (const offerData of offers) {
                    if (!offerData.id || !offerData.obj) continue;

                    await CampaignOffer.update(offerData.obj, {
                        where: {
                            campaignId: id,
                            offerId: offerData.id,
                        },
                        transaction,
                    });
                }
            }

            await transaction.commit();
            return affected;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    /**
     * Create a new campaign
     * @param {Object} campaignData - Campaign data
     * @param {string} campaignData.code - Campaign code
     * @param {string} campaignData.country - Campaign country
     * @param {string} campaignData.title - Campaign title
     * @param {string} campaignData.returnAddress - Campaign return address
     * @param {string} campaignData.description - Campaign description (optional)
     * @param {Date} campaignData.startDate - Campaign start date (optional)
     * @param {number} campaignData.chainId - Chain ID (optional)
     * @param {string} campaignData.status - Campaign status
     * @returns {Promise<Object>} Created campaign
     */
    async createCampaign(campaignData) {
        const t = await sequelize.transaction();
        try {
            // TODO: add hooks later for triming the values before inserting
            let offers = campaignData.offers;
            delete campaignData.offers;

            // Create campaign in the database with auto-incremented ID
            const campaign = await Campaign.create(campaignData, {
                transaction: t,
            });

            offers = offers.map((offer) => ({
                ...offer,
                campaignId: campaign.id,
            }));
            // Create the relation between offers and campaign

            await CampaignOffer.bulkCreate(offers, { transaction: t });
            await t.commit();
            return campaign;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    /**
     * Get campaigns with pagination
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Maximum number of records to return
     * @param {Object} filters - Filter conditions
     * @param {number} include - Include additional data
     * @param {string|null} sortField - Field to sort by
     * @param {string} sortDirection - Direction to sort (ASC or DESC)
     * @returns {Promise<Object>} Campaigns with pagination info
     */
    async getCampaigns(
        offset,
        limit,
        filters = null,
        include = 1,
        sortField = null,
        sortDirection = "ASC"
    ) {
        let whereClause = {};

        if (filters) {
            whereClause = filtersParser(filters);
        }

        try {
            // Load Brand model for filtering
            // Determine order clause
            const orderClause = sortField
                ? [[sortField, sortDirection.toUpperCase()]]
                : [["id", "DESC"]];

            // Build include options
            const countInclude = [];

            // Get accurate count with brand join if filtering by company
            const totalCount = await Campaign.count({
                where: whereClause,
                include: countInclude,
                distinct: true,
            });

            // Get campaigns with pagination and include chain data
            const campaigns = await Campaign.findAll({
                offset,
                limit,
                order: orderClause,
                attributes: {
                    exclude: ["mailQuantity"],
                    ...(include
                        ? {
                              include: [
                                  [
                                      Sequelize.literal(`(
                                WITH chain_offers AS (
                                    SELECT 
                                        co."offerId",
                                        co."index",
                                        o."title" as "offerTitle"
                                    FROM chain_offers co
                                    JOIN offers o ON co."offerId" = o."id"
                                    JOIN chains c ON co."chainId" = c."id"
                                    WHERE c."id" = "Campaign"."chainId"
                                    ORDER BY co."index" ASC
                                ),
                                campaign_offer_data AS (
                                    SELECT 
                                        cam_off."offerId",
                                        cam_off."printer",
                                        cam_off."currency",
                                        cam_off."printingPrice",
                                        cam_off."listPrice",
                                        cam_off."physicalItemPrice",
                                        cam_off."lettershopPrice",
                                        cam_off."uniqueDPPrice",
                                        cam_off."uniqueMiscPrice",
                                        cam_off."postagePrice",
                                        cam_off."purchasePrice",
                                        cam_off."payeeNameId",
                                        cam_off."returnAddressId",
                                        pn."name" as "payeeName",
                                        addr."address" as "returnAddress",
                                        addr."country" as "returnAddressCountry"
                                    FROM campaign_offers cam_off
                                    LEFT JOIN payee_names pn ON cam_off."payeeNameId" = pn."id"
                                    LEFT JOIN addresses addr ON cam_off."returnAddressId" = addr."id"
                                    WHERE cam_off."campaignId" = "Campaign"."id"
                                ),
                                print_stats AS (
                                    SELECT
                                        op."offerId",
                                        SUM(CASE WHEN op."isExported" = true THEN 1 ELSE 0 END) as "mailsQuantity",
                                        SUM(CASE WHEN op."isExported" = false THEN 1 ELSE 0 END) as "notMailedYet"
                                    FROM offer_prints op
                                    WHERE op."campaignId" = "Campaign"."id"
                                    GROUP BY op."offerId"
                                ),
                                order_stats AS (
                                    SELECT
                                        o."offerId",
                                        COUNT(o."id") as "totalOrders",
                                        SUM(o."amount" - o."discountAmount") as "totalAmountAfterDiscount"
                                    FROM orders o
                                    WHERE o."campaignId" = "Campaign"."id"
                                    GROUP BY o."offerId"
                                ),
                                skus AS (
                                    SELECT sk.*, o.id AS "offerId" from offers o
                                    JOIN campaign_offers cam_off ON cam_off."campaignId" = "Campaign".id
                                    JOIN sku_offers sk_of ON sk_of."offerId" = o.id
                                    JOIN bundle_skus sk ON sk."id" = sk_of."bundleSkuId"
                                )
                                
                                SELECT json_agg(
                                    CASE 
                                        WHEN co."index" = 1 THEN json_build_object(
                                            'offerId', co."offerId",
                                            'offerTitle', co."offerTitle",
                                            'index', co."index",
                                            'printer', COALESCE(cod."printer", ''),
                                            'payeeNameId', COALESCE(cod."payeeNameId", null),
                                            'payeeName', COALESCE(cod."payeeName", ''),
                                            'returnAddressId', COALESCE(cod."returnAddressId", null),
                                            'returnAddress', COALESCE(cod."returnAddress", ''),
                                            'returnAddressCountry', COALESCE(cod."returnAddressCountry", ''),
                                            'currency', COALESCE(cod."currency", '$'),
                                            'printingPrice', COALESCE(cod."printingPrice", 0),
                                            'listPrice', COALESCE(cod."listPrice", 0),
                                            'physicalItemPrice', COALESCE(cod."physicalItemPrice", 0),
                                            'lettershopPrice', COALESCE(cod."lettershopPrice", 0),
                                            'uniqueDPPrice', COALESCE(cod."uniqueDPPrice", 0),
                                            'uniqueMiscPrice', COALESCE(cod."uniqueMiscPrice", 0),
                                            'postagePrice', COALESCE(cod."postagePrice", 0),
                                            'purchasePrice', COALESCE(cod."purchasePrice", 0),
                                            'printingTotalPrice', COALESCE(cod."printingPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'listTotalPrice', COALESCE(cod."listPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'physicalItemTotalPrice', COALESCE(cod."physicalItemPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'lettershopTotalPrice', COALESCE(cod."lettershopPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'uniqueDPTotalPrice', COALESCE(cod."uniqueDPPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'uniqueMiscTotalPrice', COALESCE(cod."uniqueMiscPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'postageTotalPrice', COALESCE(cod."postagePrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'totalMailFixCost', (COALESCE(cod."printingPrice", 0) + COALESCE(cod."listPrice", 0) + COALESCE(cod."physicalItemPrice", 0) + COALESCE(cod."lettershopPrice", 0) + COALESCE(cod."uniqueDPPrice", 0) + COALESCE(cod."uniqueMiscPrice", 0) + COALESCE(cod."postagePrice", 0)) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'turnover', COALESCE(cod."purchasePrice", 0) * COALESCE(os."totalOrders", 0),
                                            'ROR', CASE WHEN CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END > 0 THEN COALESCE(os."totalOrders", 0)::DECIMAL / CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END ELSE 0 END,
                                            'profitLoss', (COALESCE(cod."purchasePrice", 0) * COALESCE(os."totalOrders", 0)) - ((COALESCE(cod."printingPrice", 0) + COALESCE(cod."listPrice", 0) + COALESCE(cod."physicalItemPrice", 0) + COALESCE(cod."lettershopPrice", 0) + COALESCE(cod."uniqueDPPrice", 0) + COALESCE(cod."uniqueMiscPrice", 0) + COALESCE(cod."postagePrice", 0)) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END),
                                            'mailsQuantity', COALESCE(ps."mailsQuantity", 0) + COALESCE("Campaign"."mailQuantity", 0),
                                            'notMailedYet', COALESCE(ps."notMailedYet", 0),
                                            'totalOrders', COALESCE(os."totalOrders", 0),
                                            'totalAmountAfterDiscount', COALESCE(os."totalAmountAfterDiscount", 0),
                                            'skus', (
                                                SELECT ARRAY_AGG(DISTINCT sk)
                                                FROM skus sk
                                                WHERE sk."offerId" = co."offerId"
                                            )
                                        )
                                        ELSE json_build_object(
                                            'offerId', co."offerId",
                                            'offerTitle', co."offerTitle",
                                            'index', co."index",
                                            'printer', COALESCE(cod."printer", ''),
                                            'payeeNameId', COALESCE(cod."payeeNameId", null),
                                            'payeeName', COALESCE(cod."payeeName", ''),
                                            'returnAddressId', COALESCE(cod."returnAddressId", null),
                                            'returnAddress', COALESCE(cod."returnAddress", ''),
                                            'returnAddressCountry', COALESCE(cod."returnAddressCountry", ''),
                                            'currency', COALESCE(cod."currency", '$'),
                                            'printingPrice', COALESCE(cod."printingPrice", 0),
                                            'listPrice', COALESCE(cod."listPrice", 0),
                                            'physicalItemPrice', COALESCE(cod."physicalItemPrice", 0),
                                            'lettershopPrice', COALESCE(cod."lettershopPrice", 0),
                                            'uniqueDPPrice', COALESCE(cod."uniqueDPPrice", 0),
                                            'uniqueMiscPrice', COALESCE(cod."uniqueMiscPrice", 0),
                                            'postagePrice', COALESCE(cod."postagePrice", 0),
                                            'purchasePrice', COALESCE(cod."purchasePrice", 0),
                                            'printingTotalPrice', COALESCE(cod."printingPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'listTotalPrice', COALESCE(cod."listPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'physicalItemTotalPrice', COALESCE(cod."physicalItemPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'lettershopTotalPrice', COALESCE(cod."lettershopPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'uniqueDPTotalPrice', COALESCE(cod."uniqueDPPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'uniqueMiscTotalPrice', COALESCE(cod."uniqueMiscPrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'postageTotalPrice', COALESCE(cod."postagePrice", 0) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'totalMailFixCost', (COALESCE(cod."printingPrice", 0) + COALESCE(cod."listPrice", 0) + COALESCE(cod."physicalItemPrice", 0) + COALESCE(cod."lettershopPrice", 0) + COALESCE(cod."uniqueDPPrice", 0) + COALESCE(cod."uniqueMiscPrice", 0) + COALESCE(cod."postagePrice", 0)) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END,
                                            'turnover', COALESCE(cod."purchasePrice", 0) * COALESCE(os."totalOrders", 0),
                                            'ROR', CASE WHEN CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END > 0 THEN COALESCE(os."totalOrders", 0)::DECIMAL / CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END ELSE 0 END,
                                            'profitLoss', (COALESCE(cod."purchasePrice", 0) * COALESCE(os."totalOrders", 0)) - ((COALESCE(cod."printingPrice", 0) + COALESCE(cod."listPrice", 0) + COALESCE(cod."physicalItemPrice", 0) + COALESCE(cod."lettershopPrice", 0) + COALESCE(cod."uniqueDPPrice", 0) + COALESCE(cod."uniqueMiscPrice", 0) + COALESCE(cod."postagePrice", 0)) * CASE WHEN COALESCE(ps."mailsQuantity", 0) > 0 THEN COALESCE(ps."mailsQuantity", 0) ELSE COALESCE("Campaign"."mailQuantity", 0) END),
                                            'mailsQuantity', COALESCE(ps."mailsQuantity", 0),
                                            'notMailedYet', COALESCE(ps."notMailedYet", 0),
                                            'totalOrders', COALESCE(os."totalOrders", 0),
                                            'totalAmountAfterDiscount', COALESCE(os."totalAmountAfterDiscount", 0),
                                            'skus', (
                                                SELECT ARRAY_AGG(DISTINCT sk)
                                                FROM skus sk
                                                WHERE sk."offerId" = co."offerId"
                                            )

                                        )
                                    END
                                    ORDER BY co."index" ASC
                                )
                                FROM chain_offers co
                                LEFT JOIN campaign_offer_data cod ON co."offerId" = cod."offerId"
                                LEFT JOIN print_stats ps ON co."offerId" = ps."offerId"
                                LEFT JOIN order_stats os ON co."offerId" = os."offerId"
                            )`),
                                      "chainOffers",
                                  ],
                              ],
                          }
                        : {}),
                },
                where: whereClause,
                include: [
                    {
                        model: Chain,
                        as: "chain",
                        attributes: ["id", "title"],
                    },
                    {
                        model: Offer,
                        through: {
                            attributes: [],
                        },
                        as: "offers",
                        include: [
                            {
                                model: BundleSku,
                                as: "skus",
                                through: {
                                    attributes: [],
                                },
                            },
                        ],
                    },
                    // Add brand filter if filtering by company

                    {
                        model: Brand,
                        as: "brand",
                        attributes: [],
                        required: true,
                    },
                ],
            });

            // Load brands with their companies if not already included (when filtering by company, brand is already included but without full data)
            const needsFullBrandData = campaigns.some(
                (c) => !c.brand || !c.brand.name
            );

            if (needsFullBrandData) {
                const brandIds = [
                    ...new Set(campaigns.map((c) => c.brandId).filter(Boolean)),
                ];

                const brands =
                    brandIds.length > 0
                        ? await Brand.findAll({
                              where: { id: brandIds },
                              attributes: ["id", "name", "companyId"],
                              include: [
                                  {
                                      model: Company,
                                      as: "company",
                                      attributes: ["id", "name"],
                                  },
                              ],
                          })
                        : [];

                // Map brands by ID for quick lookup
                const brandMap = new Map(brands.map((b) => [b.id, b]));

                // Attach brand to each campaign (company is accessible via brand.company)
                campaigns.forEach((campaign) => {
                    if (campaign.brandId && brandMap.has(campaign.brandId)) {
                        const brand = brandMap.get(campaign.brandId);
                        campaign.dataValues.brand = brand;
                    }
                });
            }

            // Calculate pagination info
            const pages = Math.ceil(totalCount / limit);

            return {
                campaigns,
                pagination: {
                    total: totalCount,
                    pages,
                    page: Math.floor(offset / limit) + 1,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    async getLastCampChain(offerId) {
        try {
            // Calculate date 10 days from now using dayjs
            const tenDaysFromNow = dayjs().add(10, "day").toDate();

            // Find the offer sequence with chain in a single query
            const offerSequence = await OfferSequence.findOne({
                where: {
                    currentOfferId: offerId,
                    chainId: {
                        [Op.ne]: null,
                    },
                },
                include: [
                    {
                        model: Chain,
                        as: "chain",
                        required: true,
                        include: [
                            {
                                model: Campaign,
                                as: "campaigns",
                                required: false,
                                where: {
                                    mailDate: {
                                        [Op.lte]: tenDaysFromNow, // Use the date 10 days from now
                                    },
                                    isExtracted: true,
                                },
                                order: [["mailDate", "DESC"]],
                                limit: 1,
                            },
                        ],
                    },
                ],
                order: [["createdAt", "DESC"]],
            });

            if (!offerSequence) {
                return { campaign: null, chain: null };
            }

            // Extract chain and campaign from the result
            const chain = offerSequence.chain;
            const campaign =
                chain && chain.campaigns && chain.campaigns.length > 0
                    ? chain.campaigns[0]
                    : null;

            return { campaign, chain };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get payee name for a specific campaign and offer
     * @param {number} campaignId - Campaign ID
     * @param {number} offerId - Offer ID
     * @returns {Promise<Object>} - Payee name object with id and name
     */
    async getPayeeNameForOffer(campaignId, offerId) {
        try {
            const campaignOffer = await CampaignOffer.findOne({
                where: {
                    campaignId: campaignId,
                    offerId: offerId,
                },
                include: [
                    {
                        model: PayeeName,
                        as: "payeeName",
                        attributes: ["id", "name"],
                    },
                ],
                attributes: ["payeeNameId"],
            });

            if (!campaignOffer) {
                throw new Error(
                    `Campaign offer not found for campaignId: ${campaignId}, offerId: ${offerId}`
                );
            }

            return campaignOffer.payeeName;
        } catch (error) {
            throw error;
        }
    }
}

export default new CampaignServices();


/*

1. we need weight and deminations on the sku
2. calc that weight * qty
3. when the printer print the mails. if the type is offer we need an IMAGE with client details
when it's a product we need the slip paper (check with Rahil to get the paper from him)
when it's no payment or complain keep with excel file



*/