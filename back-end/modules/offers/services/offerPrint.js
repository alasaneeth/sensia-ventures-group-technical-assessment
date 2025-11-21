import { Op, Sequelize } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import CampaignOffer from "../../campaigns/models/campaignOffer.js";
import Client from "../../clients/models/client.js";
import ExportationHistory from "../models/exportationHistory.js";
import Offer from "../models/offer.js";
import OfferPrint from "../models/offerPrint.js";
import Address from "../../campaigns/models/address.js";
import PayeeName from "../../settings/models/payeeName.js";
import Campaign from "../../campaigns/models/campaign.js";
import PrintHistory from "../models/printHistory.js";
import { generateOfferCSV, deleteCSVFile } from "./csvGenerator.js";
import ClientOffer from "../models/clientOffer.js";
import Chain from "../models/chain.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import Brand from "../../companies/models/brand.js";
import Company from "../../companies/models/company.js";
import APIError from "../../../utils/APIError.js";

class OfferPrintServices {
    /**
     * Insert a record in printer model (offer_prints table)
     * This creates a print record for mailing purposes
     * @param {number} campaignId - Campaign ID
     * @param {number} clientId - Client ID
     * @param {number} offerId - Offer ID
     * @param {string} offerCode - Offer code from client_offers
     * @param {Date} availableAt - Date when the offer is available/mail date
     * @param {Object} transaction - Database transaction (optional)
     * @returns {Promise<Object>} - Created print record
     */
    async addMail({
        poBoxId,
        campaignId,
        clientId,
        offerId,
        offerCode,
        keyCodeId,
        availableAt,
        companyId, // Optional: if provided, use it; otherwise get from campaign or client offer
        brandId, // Optional: if provided, use it; otherwise get from campaign or client offer
        transaction = null,
    }) {
        try {
            // Get companyId and brandId: use from request if provided, otherwise get from campaign or client offer
            let finalBrandId = brandId;

            if (!finalBrandId) {
                const campaign = await Campaign.findByPk(campaignId, {
                    attributes: ["brandId"],
                    transaction,
                });
                finalBrandId = campaign.brandId;
            }

            // You have the offer and the campaign what are you
            const printRecord = await OfferPrint.create(
                {
                    campaignId,
                    clientId,
                    offerId,
                    offerCode,
                    keyCodeId,
                    availableAt,
                    returnAddressId: poBoxId,
                    brandId: finalBrandId, // companyId removed - only brandId is stored
                },
                transaction ? { transaction } : {}
            );

            return printRecord;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get unexported offers from offer_prints grouped by 7-day ranges
     * @param {string|number} offset
     * @param {string|number} limit
     * @return {Promise<Offer>} - Unexported offers grouped by 7-day ranges
     */
    async getPrinterRecords(offset, limit, filters = null) {
        try {
            // Extract brandId filter if present (it MUST BE present)
            let brandFilter = "";
            let brandIds = [];

            if (filters && filters.brandId) {
                // Extract brand IDs from filter
                if (Array.isArray(filters.brandId) && filters.brandId[0]?.in) {
                    brandIds = filters.brandId[0].in;
                    brandFilter = 'AND op."brandId" IN (:brandIds)';
                }
            }

            const query = `
            WITH past_records AS (
                SELECT
                    o.id AS "offerId",
                    o.title AS "offerTitle",
                    cam_off."payeeNameId" AS "payeeNameId",
                    cam_off."returnAddressId" AS "returnAddressId",
                    cam_off.printer AS "printer",
                    NULL::timestamp AS "availableAt",
                    COUNT(op.id) AS "quantity",
                    COUNT(*) FILTER (WHERE c."isBlacklisted" = true) AS "blacklistedQuantity",
                    'past' AS "dateType",
                    MIN(op."availableAt") AS "groupDate",
                    op."brandId"
                FROM offer_prints op
                LEFT JOIN offers o ON op."offerId" = o.id
                LEFT JOIN clients c ON op."clientId" = c.id
                LEFT JOIN campaign_offers cam_off ON op."campaignId" = cam_off."campaignId" AND cam_off."offerId" = op."offerId"
                WHERE (op."isExported" = FALSE OR op."isExported" IS NULL)
                AND op."availableAt" < CURRENT_DATE
                ${brandFilter}
                GROUP BY o.id, o.title, cam_off."payeeNameId", cam_off."returnAddressId", cam_off.printer, op."availableAt", op."brandId"
            ),
            future_records AS (
                SELECT
                    o.id AS "offerId",
                    o.title AS "offerTitle",
                    cam_off."payeeNameId" AS "payeeNameId",
                    cam_off."returnAddressId" AS "returnAddressId",
                    cam_off.printer AS "printer",
                    op."availableAt",
                    COUNT(op.id) AS "quantity",
                    COUNT(*) FILTER (WHERE c."isBlacklisted" = true) AS "blacklistedQuantity",
                    'future' AS "dateType",
                    op."availableAt" AS "groupDate",
                    op."brandId"
                FROM offer_prints op
                LEFT JOIN offers o ON op."offerId" = o.id
                LEFT JOIN clients c ON op."clientId" = c.id
                LEFT JOIN campaign_offers cam_off ON op."campaignId" = cam_off."campaignId" AND cam_off."offerId" = op."offerId"
                WHERE (op."isExported" = FALSE OR op."isExported" IS NULL)
                AND op."availableAt" >= CURRENT_DATE
                ${brandFilter}
                GROUP BY o.id, o.title, cam_off."payeeNameId", cam_off."returnAddressId", cam_off.printer, op."availableAt", op."brandId"
            ),
            combined AS (
                SELECT * FROM past_records
                UNION ALL
                SELECT * FROM future_records
            )
            SELECT
                combined."offerId",
                combined."offerTitle",
                combined."payeeNameId",
                combined."returnAddressId",
                combined."printer",
                combined."availableAt",
                combined."quantity",
                combined."blacklistedQuantity",
                combined."dateType",
                combined."groupDate",
                combined."brandId",
                a.address AS "returnAddress",
                pna.name AS "payeeName",
                br.name AS "brandName",
                br."companyId" AS "companyId",
                co.name AS "companyName"
            FROM combined
            LEFT JOIN addresses a ON combined."returnAddressId" = a.id
            LEFT JOIN payee_names pna ON combined."payeeNameId" = pna.id
            LEFT JOIN brands br ON combined."brandId" = br.id
            LEFT JOIN companies co ON br."companyId" = co.id
            ORDER BY "groupDate" ASC
            LIMIT :limit OFFSET :offset;
        `;

            const countQuery = `
            WITH past_groups AS (
                SELECT
                    o.id AS "offerId",
                    o.title AS "offerTitle",
                    cam_off."payeeNameId" AS "payeeNameId",
                    cam_off."returnAddressId" AS "returnAddressId",
                    cam_off.printer AS "printer",
                    NULL::timestamp AS "availableAt",
                    COUNT(op.id) AS "quantity",
                    COUNT(*) FILTER (WHERE c."isBlacklisted" = true) AS "blacklistedQuantity",
                    'past' AS "dateType",
                    MIN(op."availableAt") AS "groupDate"
                FROM offer_prints op
                LEFT JOIN offers o ON op."offerId" = o.id
                LEFT JOIN clients c ON op."clientId" = c.id
                LEFT JOIN campaign_offers cam_off ON op."campaignId" = cam_off."campaignId" AND cam_off."offerId" = op."offerId"
                WHERE (op."isExported" = FALSE OR op."isExported" IS NULL)
                AND op."availableAt" < CURRENT_DATE
                ${brandFilter}
                GROUP BY o.id, o.title, cam_off."payeeNameId", cam_off."returnAddressId", cam_off.printer, op."availableAt"
            ),
            future_groups AS (
                SELECT
                    o.id AS "offerId",
                    o.title AS "offerTitle",
                    cam_off."payeeNameId" AS "payeeNameId",
                    cam_off."returnAddressId" AS "returnAddressId",
                    cam_off.printer AS "printer",
                    op."availableAt",
                    COUNT(op.id) AS "quantity",
                    COUNT(*) FILTER (WHERE c."isBlacklisted" = true) AS "blacklistedQuantity",
                    'future' AS "dateType",
                    op."availableAt" AS "groupDate"
                FROM offer_prints op
                LEFT JOIN offers o ON op."offerId" = o.id
                LEFT JOIN clients c ON op."clientId" = c.id
                LEFT JOIN campaign_offers cam_off ON op."campaignId" = cam_off."campaignId" AND cam_off."offerId" = op."offerId"
                WHERE (op."isExported" = FALSE OR op."isExported" IS NULL)
                AND op."availableAt" >= CURRENT_DATE
                ${brandFilter}
                GROUP BY o.id, o.title, cam_off."payeeNameId", cam_off."returnAddressId", cam_off.printer, op."availableAt"
            ),
            combined AS (
            SELECT * FROM past_groups
            UNION ALL
            SELECT * FROM future_groups
            )
            SELECT COUNT(*) AS total
            FROM combined;
        `;

            const offers = await sequelize.query(query, {
                replacements: { limit, offset, brandIds },
                type: sequelize.QueryTypes.SELECT,
            });

            const [countResult] = await sequelize.query(countQuery, {
                replacements: { brandIds },
                type: sequelize.QueryTypes.SELECT,
            });

            const count = parseInt(countResult?.total ?? 0, 10);

            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);

            return {
                offers,
                pagination: {
                    total: count,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (err) {
            console.error("Error fetching unexported offers:", err);
            throw err;
        }
    }

    async getPrinterHistory(offset = 0, limit = 10, filters = null) {
        try {
            // Build where clause and brand join filters for company/brand
            const whereClause = {};
            let brandWhereClause = {};

            if (filters) {
                const parsedFilters = filtersParser(filters);

                // Handle companyId/brandId filters through brand
                if (parsedFilters[Op.and]) {
                    const rest = [];
                    parsedFilters[Op.and].forEach((cond) => {
                        if (cond.companyId)
                            brandWhereClause.companyId = cond.companyId;
                        else if (cond.brandId)
                            brandWhereClause.id = cond.brandId;
                        else rest.push(cond);
                    });
                    if (rest.length > 0) parsedFilters[Op.and] = rest;
                    else delete parsedFilters[Op.and];
                } else {
                    if (parsedFilters.companyId) {
                        brandWhereClause.companyId = parsedFilters.companyId;
                        delete parsedFilters.companyId;
                    }
                    if (parsedFilters.brandId) {
                        brandWhereClause.id = parsedFilters.brandId;
                        delete parsedFilters.brandId;
                    }
                }

                Object.assign(whereClause, parsedFilters);
            }

            const { rows: offers, count } =
                await ExportationHistory.findAndCountAll({
                    where:
                        Object.keys(whereClause).length > 0
                            ? whereClause
                            : undefined,
                    offset,
                    limit,
                    order: [["id", "DESC"]],
                    include: [
                        {
                            model: Brand,
                            as: "brand",
                            attributes: ["id", "name", "companyId"],
                            required: Object.keys(brandWhereClause).length > 0,
                            ...(Object.keys(brandWhereClause).length > 0 && {
                                where: brandWhereClause,
                            }),
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
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);

            return {
                offers,
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

    async printRecords({
        offerId,
        offerTitle,
        returnAddress,
        returnAddressId,
        availableAt,
        quantity,
        payeeName,
        payeeNameId,
        printer,
        dateType, // 'past' or 'future' to determine filtering strategy
        companyId, // Optional: if provided, use it; otherwise get from campaign
        brandId, // Optional: if provided, use it; otherwise get from campaign
    }) {
        const t = await sequelize.transaction();
        try {
            // Get the offer details including payeeName if not provided
            const offer = await Offer.findByPk(offerId, {
                attributes: ["id", "title", "type"],
                transaction: t,
            });

            if (!offer) {
                throw new Error("Offer not found");
            }

            // Make raw where clause to copy the records from print table to history table
            let rawWhere = {
                offerId: offerId,
                returnAddressId: returnAddressId ? returnAddressId : null,
                payeeNameId: payeeNameId ? payeeNameId : null,
                printer: printer,
                isBlacklisted: false, // Default: don't include blacklisted clients
                brandId,
            };
            // Build where clause for filtering offer_prints

            let whereClause = {
                offerId: offerId,
                isExported: false,
                brandId,
                "$client.isBlacklisted$": false,
                "$offer.offerCampaigns.returnAddressId$": returnAddressId
                    ? returnAddressId
                    : null,
                "$offer.offerCampaigns.payeeNameId$": payeeNameId
                    ? payeeNameId
                    : null,
                "$offer.offerCampaigns.printer$": printer ? printer : null,
            };

            if (dateType === "past") {
                // For past records, export all records before today for this offer/returnAddress/payeeName combination
                whereClause.availableAt = {
                    [Op.lt]: new Date(),
                };

                rawWhere.availableAt = new Date();
            } else {
                // For future records, use the specific date
                whereClause.availableAt = new Date(availableAt);
                rawWhere.availableAt = new Date(availableAt);
            }

            // Select from offer_prints using the dynamic where clause
            let printRecords = await OfferPrint.findAll({
                where: whereClause,
                distinct: true,
                include: [
                    {
                        model: Client,
                        as: "client",
                        required: true,
                        // where: {
                        //     isBlacklisted: false,
                        // },
                    },
                    {
                        model: Offer,
                        as: "offer",
                        required: true,
                        // where: {
                        //     returnAddressId: returnAddressId
                        //         ? returnAddressId
                        //         : null,
                        // },
                        // include: [
                        //     {
                        //         model: Address,
                        //         as: "returnAddress",
                        //     },
                        //     {
                        //         model: PayeeName,
                        //         as: "payeeName",
                        //     },
                        // ],
                        include: [
                            {
                                model: CampaignOffer,
                                as: "offerCampaigns",
                                where: {
                                    campaignId: Sequelize.where(
                                        Sequelize.col("offerPrint.campaignId"),
                                        "=",
                                        Sequelize.col(
                                            "offer->offerCampaigns.campaignId"
                                        )
                                    ),
                                    offerId: Sequelize.where(
                                        Sequelize.col("offerPrint.offerId"),
                                        "=",
                                        Sequelize.col(
                                            "offer->offerCampaigns.offerId"
                                        )
                                    ),
                                },
                                include: [
                                    {
                                        model: Address,
                                        as: "returnAddress",
                                    },
                                    {
                                        model: PayeeName,
                                        as: "payeeName",
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        // attributes: [],
                        model: Campaign,
                        as: "campaign",
                        // where: {
                        //     payeeNameId,
                        // },
                    },
                ],
                transaction: t,
            });

            // this one to know how many records gonna skip
            // Create a new where clause for skipped records
            const skippedWhereClause = {
                offerId: offerId,
                isExported: false,
                availableAt: whereClause.availableAt,
                brandId,
                "$client.isBlacklisted$": true,
                "$offer.offerCampaigns.returnAddressId$": returnAddressId
                    ? returnAddressId
                    : null,
                "$offer.offerCampaigns.payeeNameId$": payeeNameId
                    ? payeeNameId
                    : null,
                "$offer.offerCampaigns.printer$": printer ? printer : null,
            };

            const skippedQuantity = await OfferPrint.count({
                where: skippedWhereClause,
                include: [
                    {
                        model: Client,
                        attributes: [],
                        as: "client",
                        required: true,
                        where: {
                            isBlacklisted: true,
                        },
                    },
                    {
                        model: Offer,
                        attributes: [],
                        as: "offer",
                        required: true,
                        // include: [
                        //     {
                        //         model: PayeeName,
                        //         as: "payeeName",
                        //     },
                        // ],
                        // where: {
                        //     payeeNameId,
                        // },
                        include: [
                            {
                                model: CampaignOffer,
                                as: "offerCampaigns",
                                where: {
                                    campaignId: Sequelize.where(
                                        Sequelize.col("offerPrint.campaignId"),
                                        "=",
                                        Sequelize.col(
                                            "offer->offerCampaigns.campaignId"
                                        )
                                    ),
                                    offerId: Sequelize.where(
                                        Sequelize.col("offerPrint.offerId"),
                                        "=",
                                        Sequelize.col(
                                            "offer->offerCampaigns.offerId"
                                        )
                                    ),
                                },
                            },
                        ],
                    },
                    {
                        model: Campaign,
                        as: "campaign",
                    },
                ],
                transaction: t,
            });

            // Check if there is no print records and no skipped quantity
            const isClientServices = offer.type === "client-services";
            const noRecordsAndNoSkipped =
                printRecords.length === 0 && skippedQuantity === 0;

            // For client-services, override printRecords to include all records (blacklisted and non-blacklisted)
            if (isClientServices) {
                // Update rawWhere to include blacklisted clients
                rawWhere.isBlacklisted = null; // null means include all (both blacklisted and non-blacklisted)

                const allRecordsWhereClause = {
                    offerId: offerId,
                    isExported: false,
                    "$offer.offerCampaigns.returnAddressId$": returnAddressId
                        ? returnAddressId
                        : null,
                    "$offer.offerCampaigns.payeeNameId$": payeeNameId
                        ? payeeNameId
                        : null,
                    "$offer.offerCampaigns.printer$": printer ? printer : null,
                    brandId,
                };

                if (dateType === "past") {
                    allRecordsWhereClause.availableAt = {
                        [Op.lt]: new Date(),
                    };
                } else {
                    allRecordsWhereClause.availableAt = new Date(availableAt);
                }

                printRecords = await OfferPrint.findAll({
                    where: allRecordsWhereClause,
                    distinct: true,
                    include: [
                        {
                            model: Client,
                            as: "client",
                            required: true,
                        },
                        {
                            model: Offer,
                            as: "offer",
                            required: true,
                            include: [
                                {
                                    model: CampaignOffer,
                                    as: "offerCampaigns",
                                    where: {
                                        campaignId: Sequelize.where(
                                            Sequelize.col(
                                                "offerPrint.campaignId"
                                            ),
                                            "=",
                                            Sequelize.col(
                                                "offer->offerCampaigns.campaignId"
                                            )
                                        ),
                                        offerId: Sequelize.where(
                                            Sequelize.col("offerPrint.offerId"),
                                            "=",
                                            Sequelize.col(
                                                "offer->offerCampaigns.offerId"
                                            )
                                        ),
                                    },
                                    include: [
                                        {
                                            model: Address,
                                            as: "returnAddress",
                                        },
                                        {
                                            model: PayeeName,
                                            as: "payeeName",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            model: Campaign,
                            as: "campaign",
                        },
                    ],
                    transaction: t,
                });
            }

            if (noRecordsAndNoSkipped && !isClientServices) {
                throw new Error("No print records found to export");
            }

            //

            // Generate filename with offer title and date
            const dateStr = new Date(availableAt).toISOString().split("T")[0];
            const fileName = `${offer.title}_${dateStr}.csv`;

            // For client-services, printRecords already includes all records (blacklisted and non-blacklisted)
            const filePath = await generateOfferCSV(printRecords, fileName);

            // Mark print records as exported
            const printIds = printRecords.map((p) => p.id);
            // The same return address because we group
            const address =
                printRecords[0]?.offer?.offerCampaigns?.[0]?.returnAddress
                    ?.address;

            // Register it in the history as a file
            const hist = await ExportationHistory.create(
                {
                    offerId: offerId,
                    offer: offerTitle,
                    returnAddress: address || "N/A",
                    exportedAt: new Date(),
                    quantity: printRecords.length + skippedQuantity,
                    blacklistedQuantity: "",
                    skippedQuantity: skippedQuantity,
                    payeeName: payeeName ? payeeName : null,
                    fileName: fileName,
                    availableDate: availableAt,
                    isPast: dateType === "past",
                    brandId,
                },
                { transaction: t }
            );

            rawWhere.historyId = hist.id;

            // Copy the records now (only if there are records to copy)
            if (printRecords.length > 0) {
                const q = `
                INSERT INTO print_history
                ("historyId", "dataEntryCode", "campaignCode", "mailDate", "clientId",
                "firstName", "lastName", "gender", "phone", "state", "city", "zipCode", "country",
                "address1", "address2", "address3")

                SELECT
                :historyId,
                "offerCode", -- this is the data entry code in the print records. NOT the offer code
                "campaigns"."code",
                "availableAt",
                "clients".id,
                "clients"."firstName",
                "clients"."lastName",
                "clients"."gender",
                "clients"."phone",
                "clients"."state",
                "clients"."city",
                "clients"."zipCode",
                "clients"."country",
                "clients"."address1",
                "clients".address2,
                "clients".address3

                FROM "offer_prints"
                INNER JOIN "clients" ON "clients".id = "offer_prints"."clientId"
                INNER JOIN "offers" ON "offers".id = "offer_prints"."offerId"
                INNER JOIN "campaign_offers" ON "campaign_offers"."offerId" = "offer_prints"."offerId"
                AND "campaign_offers"."campaignId" = "offer_prints"."campaignId"
                INNER JOIN "campaigns" ON "campaigns".id = "campaign_offers"."campaignId"

                WHERE "offers".id = :offerId
                AND "offer_prints"."isExported" = false
                ${
                    rawWhere.isBlacklisted !== null
                        ? `AND "clients"."isBlacklisted" = :isBlacklisted`
                        : ""
                }
                AND ${
                    returnAddressId === null || returnAddressId === undefined
                        ? '"campaign_offers"."returnAddressId" IS NULL'
                        : '"campaign_offers"."returnAddressId" = :returnAddressId'
                }
                AND ${
                    payeeNameId === null || payeeNameId === undefined
                        ? '"campaign_offers"."payeeNameId" IS NULL'
                        : '"campaign_offers"."payeeNameId" = :payeeNameId'
                }
                AND ${
                    printer === null || printer === undefined
                        ? '"campaign_offers"."printer" IS NULL'
                        : '"campaign_offers"."printer" = :printer'
                }
                AND ${
                    dateType === "past"
                        ? '"offer_prints"."availableAt" < :availableAt'
                        : '"offer_prints"."availableAt" = :availableAt'
                }
                ${
                    brandId !== null || brandId !== undefined
                        ? 'AND "offer_prints"."brandId" = :brandId'
                        : ""
                }
            `;

                await sequelize.query(q, {
                    replacements: rawWhere,
                    type: sequelize.QueryTypes.INSERT,
                    transaction: t,
                });
            }

            // Mark the non-blacklisted clients as exported
            await OfferPrint.update(
                {
                    isExported: true,
                },
                {
                    where: {
                        id: printIds,
                    },
                    transaction: t,
                }
            );

            // Mark the blacklisted clients as exported also to prevent sending them again by mistake
            // Use PostgreSQL's UPDATE ... FROM syntax for better performance
            const blacklistedUpdateQuery = `
            UPDATE "offer_prints"
            SET "isExported" = true
            FROM "clients", "offers", "campaign_offers"
            WHERE "clients".id = "offer_prints"."clientId"
                AND "offers".id = "offer_prints"."offerId"
                AND "campaign_offers"."offerId" = "offer_prints"."offerId"
                AND "campaign_offers"."campaignId" = "offer_prints"."campaignId"
                AND "offers".id = :offerId
                AND "offer_prints"."isExported" = false
                AND "clients"."isBlacklisted" = true
                AND ${
                    returnAddressId === null || returnAddressId === undefined
                        ? '"campaign_offers"."returnAddressId" IS NULL'
                        : '"campaign_offers"."returnAddressId" = :returnAddressId'
                }
                AND ${
                    payeeNameId === null || payeeNameId === undefined
                        ? '"campaign_offers"."payeeNameId" IS NULL'
                        : '"campaign_offers"."payeeNameId" = :payeeNameId'
                }
                AND ${
                    printer === null || printer === undefined
                        ? '"campaign_offers"."printer" IS NULL'
                        : '"campaign_offers"."printer" = :printer'
                }
                AND ${
                    dateType === "past"
                        ? '"offer_prints"."availableAt" < :availableAt'
                        : '"offer_prints"."availableAt" = :availableAt'
                }
                ${brandId ? 'AND "offer_prints"."brandId" = :brandId' : ""}
            
        `;

            await sequelize.query(blacklistedUpdateQuery, {
                replacements: rawWhere,
                type: sequelize.QueryTypes.UPDATE,
                transaction: t,
            });

            await t.commit();

            // Return file path and cleanup function that doesn't delete the file
            return {
                filePath,
                fileName,
                affected: printRecords.length,
                cleanup: () => {
                    // Keep file and just log it (fire and forget)
                    setImmediate(() => deleteCSVFile(filePath));
                },
            };
        } catch (err) {
            await t.rollback();
            console.error("Error exporting offer:", err);
            throw err;
        }
    }

    /**
     * Get the exported offer file by ID
     * @param {string|number} id - The ID of the exportation history record
     * @returns {Promise<Object>} - Object containing the file path and name
     */
    async printHistoryRecords(id) {
        try {
            // Find the exportation history record by ID
            const exportRecord = await ExportationHistory.findByPk(id, {
                include: {
                    model: PrintHistory,
                    as: "printHistoryRecords",
                },
            });

            if (!exportRecord) {
                throw new APIError(
                    `Export record with ID ${id} not found`,
                    404
                );
            }

            const fileName = exportRecord.fileName;
            const filePath = await generateOfferCSV(
                exportRecord,
                fileName,
                true
            );

            return {
                filePath: filePath,
                fileName: fileName,
                offer: exportRecord.offer,
                cleanUp: () => {
                    setImmediate(() => deleteCSVFile(filePath));
                },
            };
        } catch (err) {
            console.error(`Error getting exported offer file: ${err.message}`);
            throw err;
        }
    }

    // This function for delete order don't use it outside. it will delete only one mail file :)
    async _deleteMails(whereClause = {}, transaction = null) {
        try {
            const record = await OfferPrint.findOne({
                where: whereClause,
                ...(transaction && { transaction }),
            });

            if (!record) {
                throw new APIError(
                    "The mails is/are not found. or they/it already deleted",
                    404,
                    "NOT_FOUND"
                );
            }

            await record.destroy({
                ...(transaction && { transaction }),
            });

            return 1;
        } catch (err) {
            throw err;
        }
    }
}

export default new OfferPrintServices();
