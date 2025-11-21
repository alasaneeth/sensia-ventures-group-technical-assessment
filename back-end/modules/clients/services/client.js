import { Op } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import APIError from "../../../utils/APIError.js";
import Campaign from "../../campaigns/models/campaign.js";
import Chain from "../../offers/models/chain.js";
import { Sequelize } from "sequelize";
import OfferSequence from "../../offers/models/offerSequence.js";
import ClientsImportHistory from "../models/clientsImportHistory.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import Client from "../models/client.js";
import { parseClientsFile } from "./parseClientsFile.js";
import Brand from "../../companies/models/brand.js";
import Company from "../../companies/models/company.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

class ClientServices {
    async createClient(clientData) {
        // Convert country to lowercase if provided
        if (clientData.country) {
            clientData.country = clientData.country.toLowerCase();
        }

        try {
            // Create new client with all the fields from the model
            const client = await Client.create(clientData);

            // Return client data
            return client;
        } catch (error) {
            console.error("Error creating client:", error);
            throw error;
        }
    }
    async getClientById(id) {
        try {
            const client = await Client.findByPk(id, {
                attributes: {
                    exclude: ["totalMails", "totalOrders", "totalAmount"],
                    include: [
                        [
                            Sequelize.literal(`
                            COALESCE(
                                (SELECT SUM("orders"."amount")
                                FROM "orders"
                                WHERE "orders"."clientId" = "Client"."id"),
                                0
                            ) + COALESCE("Client"."totalAmount", 0)
                        `),
                            "totalAmount",
                        ],
                        [
                            Sequelize.literal(`
                            COALESCE(
                                (SELECT COUNT("orders"."amount")
                                FROM "orders"
                                WHERE "orders"."clientId" = "Client"."id"),
                                0
                            ) + COALESCE("Client"."totalOrders", 0)
                        `),
                            "totalOrders",
                        ],
                        [
                            Sequelize.literal(
                                `
                            COALESCE(
                                (SELECT COUNT("offer_prints"."clientId")
                                FROM "offer_prints"
                                WHERE "offer_prints"."clientId" = "Client"."id" AND "offer_prints"."isExported" = true),
                                0
                            ) + COALESCE("Client"."totalMails", 0)
                        `
                            ),
                            "totalMails",
                        ],
                    ],
                },
            });

            if (!client) {
                throw new APIError("Client not found", 404, "CLIENT_NOT_FOUND");
            }

            return client;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get clients with pagination
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Number of items per page
     * @param {string|null} country - Optional country filter
     * @returns {Promise<Object>} - Clients data with pagination info
     */
    async getClients(offset = 0, limit = 10, filters = {}, sort = [], or = []) {
        try {
            // Handle fullName filter - extract and remove from filters
            let fullNameQuery = null;
            if (
                filters.fullName &&
                filters.fullName[0] &&
                filters.fullName[0].eq
            ) {
                fullNameQuery = filters.fullName[0].eq;
                delete filters.fullName;
            }

            let whereClause = {};
            if (filters) whereClause = filtersParser(filters, or);

            // Add fullName search condition if fullName was provided
            if (fullNameQuery) {
                whereClause[Op.and] = whereClause[Op.and] || [];
                whereClause[Op.and].push(
                    Sequelize.where(
                        Sequelize.fn(
                            "lower",
                            Sequelize.fn(
                                "concat_ws",
                                " ",
                                Sequelize.col("firstName"),
                                Sequelize.col("lastName")
                            )
                        ),
                        {
                            [Op.iLike]: `%${fullNameQuery.toLowerCase()}%`,
                        }
                    )
                );
            }

            let orderStatement;
            if (sort[0] !== undefined && sort[1] !== undefined) {
                orderStatement = [sort];
            } else {
                orderStatement = [["id", "DESC"]];
            }

            // Build include array - always include Brand to show brand/company data
            const includeArray = [
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
            ];

            // Get clients with pagination and filter
            const { rows: clients, count: totalCount } =
                await Client.findAndCountAll({
                    attributes: {
                        exclude: ["totalMails", "totalOrders", "totalAmount"],
                        include: [
                            [
                                Sequelize.literal(`
                                COALESCE(
                                    (SELECT SUM("orders"."amount")
                                    FROM "orders"
                                    WHERE "orders"."clientId" = "Client"."id"),
                                    0
                                ) + COALESCE("Client"."totalAmount", 0)
                            `),
                                "totalAmount",
                            ],
                            [
                                Sequelize.literal(`
                                COALESCE(
                                    (SELECT COUNT("orders"."amount")
                                    FROM "orders"
                                    WHERE "orders"."clientId" = "Client"."id"),
                                    0
                                ) + COALESCE("Client"."totalOrders", 0)
                            `),
                                "totalOrders",
                            ],
                            [
                                Sequelize.literal(
                                    `
                                COALESCE(
                                    (SELECT COUNT("offer_prints"."clientId")
                                    FROM "offer_prints"
                                    WHERE "offer_prints"."clientId" = "Client"."id" AND "offer_prints"."isExported" = true),
                                    0
                                ) + COALESCE("Client"."totalMails", 0)
                            `
                                ),
                                "totalMails",
                            ],
                        ],
                    },
                    include: includeArray.length > 0 ? includeArray : undefined,
                    where: whereClause,
                    limit,
                    offset,
                    order: orderStatement,
                    distinct: true, // Important for accurate count when using includes
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            // Return clients with pagination info
            return {
                data: clients,
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
     * Get clients that are not enrolled in a specific campaign and offer
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Number of items per page
     * @param {number} campaignId - Campaign ID to filter against
     * @param {string|null} country - Optional country filter
     * @returns {Promise<Object>} - Clients data with pagination info
     */
    async getNotExtractedClients(
        offset = 0,
        limit = 10,
        campaignId,
        offerId,
        filters = {},
        sort = []
    ) {
        try {
            console.log('\n####### here is thre filters for not selcetd clients#########\n', filters ,'\n################\n');
            // From this campaign get the chain id. from that chain id you can get the first offer
            const campaign = await Campaign.findByPk(campaignId);

            if (!campaign) {
                throw new APIError(
                    "The campaign is not found",
                    404,
                    "CAMPAIGN_NOT_FOUND"
                );
            }

            const chain = await Chain.findByPk(campaign.chainId);
            const firstOfferSequence = await OfferSequence.findByPk(
                chain.offerSequenceId
            );

            if (!offerId) {
                ////// Throw the error in the future now take the first offer in the chain

                // throw new APIError(
                //     "Offer Id is required",
                //     400,
                //     "OFFER_ID_REQUIRED"
                // );

                offerId = firstOfferSequence.currentOfferId;
            }

            // // Parse date filters from mm/dd/yyyy to Date object
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

            // make sure to get by offer and campaign
            // Extract computed metric filters before passing to filtersParser
            const filtersCopy = { ...(filters || {}) };
            const metricWheres = [];

            // Define computed metric literals
            const totalOrdersLiteral = Sequelize.literal(`
                COALESCE(
                    (SELECT COUNT("orders"."amount")
                    FROM "orders"
                    WHERE "orders"."clientId" = "Client"."id"),
                    0
                ) + COALESCE("Client"."totalOrders", 0)
            `);

            const totalMailsLiteral = Sequelize.literal(`
                COALESCE(
                    (SELECT COUNT("offer_prints"."clientId")
                    FROM "offer_prints"
                    WHERE "offer_prints"."clientId" = "Client"."id" AND "offer_prints"."isExported" = true),
                    0
                ) + COALESCE("Client"."totalMails", 0)
            `);

            const totalAmountLiteral = Sequelize.literal(`
                COALESCE(
                    (SELECT SUM("orders"."amount")
                    FROM "orders"
                    WHERE "orders"."clientId" = "Client"."id"),
                    0
                ) + COALESCE("Client"."totalAmount", 0)
            `);

            // Handle totalOrders filter
            if (filtersCopy.totalOrders && Array.isArray(filtersCopy.totalOrders)) {
                filtersCopy.totalOrders.forEach((f) => {
                    const opKey = Object.keys(f)[0];
                    const sqlOp = Op[opKey];
                    if (sqlOp) {
                        metricWheres.push(
                            Sequelize.where(totalOrdersLiteral, {
                                [sqlOp]: f[opKey],
                            })
                        );
                    }
                });
                delete filtersCopy.totalOrders;
            }

            // Handle totalMails filter
            if (filtersCopy.totalMails && Array.isArray(filtersCopy.totalMails)) {
                filtersCopy.totalMails.forEach((f) => {
                    const opKey = Object.keys(f)[0];
                    const sqlOp = Op[opKey];
                    if (sqlOp) {
                        metricWheres.push(
                            Sequelize.where(totalMailsLiteral, {
                                [sqlOp]: f[opKey],
                            })
                        );
                    }
                });
                delete filtersCopy.totalMails;
            }

            // Handle totalAmount filter
            if (filtersCopy.totalAmount && Array.isArray(filtersCopy.totalAmount)) {
                filtersCopy.totalAmount.forEach((f) => {
                    const opKey = Object.keys(f)[0];
                    const sqlOp = Op[opKey];
                    if (sqlOp) {
                        metricWheres.push(
                            Sequelize.where(totalAmountLiteral, {
                                [sqlOp]: f[opKey],
                            })
                        );
                    }
                });
                delete filtersCopy.totalAmount;
            }

            // Build normal where from remaining filters
            const normalWhere = filtersParser(filtersCopy);

            // Prepare where clause - filter by key_codes instead of client_offers.
            const whereClause = {
                id: {
                    [Op.notIn]: sequelize.literal(`(
                    SELECT DISTINCT "clientId" 
                    FROM key_codes
                    WHERE "campaignId" = ${campaignId}
                )`),
                },
                ////// Open it in the future when the user will select an offer
                // id: {
                //     [Op.notIn]: sequelize.literal(`(
                //         SELECT DISTINCT "clientId"
                //         FROM key_codes
                //         WHERE "campaignId" = ${campaignId} AND "offerId" = ${offerId}
                //     )`),
                // },
                ...(metricWheres.length > 0
                    ? {
                          [Op.and]: [
                              ...metricWheres,
                              ...(Object.keys(filtersCopy).length > 0
                                  ? [normalWhere]
                                  : []),
                          ],
                      }
                    : normalWhere),
            };

            // Build include array - always include Brand to show brand/company data
            const includeArray = [
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
            ];

            // Get clients with pagination and filter
            const { rows: clients, count: totalCount } =
                await Client.findAndCountAll({
                    attributes: {
                        exclude: ["totalMails", "totalOrders", "totalAmount"],
                        include: [
                            [totalAmountLiteral, "totalAmount"],
                            [totalOrdersLiteral, "totalOrders"],
                            [totalMailsLiteral, "totalMails"],
                        ],
                    },
                    include: includeArray.length > 0 ? includeArray : undefined,
                    where: whereClause,
                    limit,
                    offset,
                    order: sort[0] && sort[1] ? [sort] : [["id", "DESC"]],
                    distinct: true, // Important for accurate count when using includes
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            // // Format client data
            // const formattedClients = clients.map((client) => ({
            //     id: client.id,
            //     first_name: client.first_name,
            //     last_name: client.last_name,
            //     email: client.email,
            //     address_1: client.address_1,
            //     address_2: client.address_2,
            //     zip_code_1: client.zip_code_1,
            //     zip_code_2: client.zip_code_2,
            //     full_name: `${client.first_name} ${client.last_name}`,
            //     phone: client.phone,
            //     country: client.country,
            // }));

            // Return clients with pagination info
            return {
                data: clients,
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

    async getImportHistory(offset, limit, filters = {}) {
        // Build where clause from filters
        let whereClause = {};
        if (Object.keys(filters).length > 0) {
            whereClause = filtersParser(filters);
        }

        const { rows: importHistory, count } =
            await ClientsImportHistory.findAndCountAll({
                where: whereClause,
                order: [["createdAt", "DESC"]],
                offset,
                limit,
            });

        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(count / limit);

        return {
            data: importHistory,
            pagination: {
                total: count,
                pages: totalPages,
                page: currentPage,
                limit,
            },
        };
    }

    /**
     * Import client database from a file
     * @param {Object} fileInfo - Information about the uploaded file
     * @param {string} fileInfo.fileName - Original name of the file
     * @param {Buffer} fileInfo.buffer - File content as a buffer
     * @param {string} fileInfo.fileType - MIME type of the file
     * @returns {Promise<Object>} - Import history record
     */
    async importDatabase(fileInfo, brandId = null) {
        const t = await sequelize.transaction();
        try {
            const { fileName, fileType, filePath } = fileInfo;

            // Create a record in the import history table
            const importRecord = await ClientsImportHistory.create(
                {
                    fileName,
                    brandId,
                },
                { transaction: t }
            );

            // if (fileName.toUpperCase().trim() === "FM0212_JP.TXT") {
            //     console.log("REached ?");
            //     await parseFile1(filePath, fileName, t);
            // } else if (fileName === "FM0212_JP.xlsx") {
            //     // await analyzeFile2(filePath, importRecord.id);
            // }
            await parseClientsFile(filePath, fileName, t, {
                batchSize: 100,
                brandId,
            });

            // TODO: Process the file based on its type
            // if (fileType === 'text/csv') {
            //     // Process CSV file
            //     await processCSVFile(buffer, importRecord.id);
            // } else if (fileType.includes('excel')) {
            //     // Process Excel file
            //     await processExcelFile(buffer, importRecord.id);
            // }

            // Commit the transaction
            await t.commit();

            return importRecord;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    /**
     *
     * @param {string|number} clientId
     * @param {Object} data
     * @returns {Promise<Client>}
     */
    async updateClient(clientId, data) {
        try {
            // Replace each null with undefiend to make sequelize filter it
            Object.keys(data).forEach((key) => {
                if (data[key] === null) {
                    data[key] = undefined;
                }
            });

            const [_, client] = await Client.update(data, {
                where: {
                    id: clientId,
                },
                returning: true,
                logging: true,
            });

            // This need to update the 'update' object
            const newObj = {};
            for (let key in data) {
                newObj[`client_${key}`] = data[key];
            }

            // Update all offers given for this client to make sure new data will contain new infromation
            // await ClientOffer.update(newObj, {
            //     where: {
            //         client_id: clientId,
            //     },
            // });

            return client;
        } catch (error) {
            console.error("Error updating client:", error);
            throw error;
        }
    }
}

export default new ClientServices();
