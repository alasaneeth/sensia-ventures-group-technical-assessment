import User from "../../auth/models/user.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
import {
    filtersParser,
    rawSearchParser,
} from "../../../utils/filterParsers.js";
import Company from "../../companies/models/company.js";
import Brand from "../../companies/models/brand.js";
import { Op, where } from "sequelize";

class AccountingServices {
    async createInvoice(attr) {
        try {
            const invoice = await Invoice.create(attr);
            return invoice;
        } catch (err) {
            throw err;
        }
    }

    async getInvoices(offset = 0, limit = 10, filters = null) {
        try {
            let whereClause = {};

            if (filters) {
                whereClause = filtersParser(filters);
            }

            const { rows: invoices, count } = await Invoice.findAndCountAll({
                where: whereClause,
                offset,
                limit,
                order: [["id", "DESC"]],
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
                distinct: true,
            });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);

            return {
                data: invoices,
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

    async createPayment(attr) {
        try {
            const payment = await Payment.create(attr);
            return payment;
        } catch (err) {
            throw err;
        }
    }

    async getPayments(offset = 0, limit = 10, filters = null) {
        try {
            let whereClause = {};

            if (filters) {
                whereClause = filtersParser(filters);
            }

            const { rows: payments, count } = await Payment.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: "confirmedBy",
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
                offset,
                limit,
                order: [["id", "DESC"]],
                distinct: true,
            });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);

            return {
                data: payments,
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

    async getSummary(offset = 0, limit = 10, filters = null) {
        try {
            // Extract brandIds from filters
            let brandIdCondition = "";
            let replacements = { limit, offset };

            if (filters?.brandId[0]?.in && Array.isArray(filters.brandId[0].in)) {
                replacements.brandIds  = filters.brandId[0].in;
            }

            // Single query combining invoices and payments with UNION, grouped by brandId
            const query = `
                SELECT
                    "brandId",
                    partner,
                    currency,
                    COALESCE(SUM(invoices), 0) AS "totalInvoices",
                    COALESCE(SUM(payments), 0) AS "totalPayments",
                    COALESCE(SUM(invoices), 0) - COALESCE(SUM(payments), 0) AS due
                FROM (
                    SELECT
                        i."brandId",
                        i.partner,
                        i.currency,
                        SUM(i.price) AS invoices,
                        0::numeric AS payments
                    FROM invoices i
                    WHERE 1=1 AND i."brandId" IN (:brandIds)
                    GROUP BY i."brandId", i.partner, i.currency

                    UNION ALL

                    SELECT
                        p."brandId",
                        p.partner,
                        p.currency,
                        0::numeric AS invoices,
                        SUM(p.amount) AS payments
                    FROM payments p
                    WHERE 1=1 AND p."brandId" IN (:brandIds)
                    GROUP BY p."brandId", p.partner, p.currency
                ) combined
                GROUP BY "brandId", partner, currency
                ORDER BY "brandId", partner
                LIMIT :limit OFFSET :offset
            `;

            const summaryData = await Invoice.sequelize.query(query, {
                replacements,
                type: Invoice.sequelize.QueryTypes.SELECT,
                raw: true,
            });

            // Count total distinct (brandId, partner, currency) tuples
            const countQuery = `
                SELECT COUNT(*) AS total
                FROM (
                    SELECT "brandId", partner, currency
                    FROM (
                        SELECT i."brandId", i.partner, i.currency
                        FROM invoices i
                        WHERE 1=1 AND i."brandId" IN (:brandIds)
                        GROUP BY i."brandId", i.partner, i.currency

                        UNION

                        SELECT p."brandId", p.partner, p.currency
                        FROM payments p
                        WHERE 1=1 AND p."brandId" IN (:brandIds)
                        GROUP BY p."brandId", p.partner, p.currency
                    ) u
                    GROUP BY "brandId", partner, currency
                ) grouped
            `;

            const countResult = await Invoice.sequelize.query(countQuery, {
                replacements,
                type: Invoice.sequelize.QueryTypes.SELECT,
                raw: true,
            });

            const total = parseInt(countResult[0].total, 10);

            // Fetch brand and company information for each unique brandId
            const brandIds = [...new Set(summaryData.map((row) => row.brandId))];
            const brands = await Brand.findAll({
                where: { id: brandIds },
                include: [
                    {
                        model: Company,
                        as: "company",
                        attributes: ["id", "name"],
                    },
                ],
                attributes: ["id", "name", "companyId"],
                raw: true,
            });

            // Create a map of brandId to brand info
            const brandMap = {};
            brands.forEach((brand) => {
                brandMap[brand.id] = {
                    id: brand.id,
                    name: brand.name,
                    companyId: brand.companyId,
                    company: {
                        id: brand["company.id"],
                        name: brand["company.name"],
                    },
                };
            });

            // Enrich summary data with brand and company info
            const enrichedData = summaryData.map((row) => ({
                ...row,
                brand: brandMap[row.brandId] || null,
            }));

            return {
                data: enrichedData,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    page: Math.floor(offset / limit) + 1,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    async editPayment(id, data) {
        try {
            const [count] = await Payment.update(data, {
                where: { id },
            });

            const updatedPayment = await Payment.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "confirmedBy",
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
            });

            return updatedPayment;
        } catch (err) {
            throw err;
        }
    }
    async editInvoice(id, data) {
        try {
            const [count] = await Invoice.update(data, {
                where: { id },
            });

            const updatedInvoice = await Invoice.findByPk(id, {
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
            });

            return updatedInvoice;
        } catch (err) {
            throw err;
        }
    }
}

export default new AccountingServices();
