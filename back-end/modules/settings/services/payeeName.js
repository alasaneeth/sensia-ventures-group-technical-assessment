import APIError from "../../../utils/APIError.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import PayeeName from "../models/payeeName.js";
import { Op } from "sequelize";
import Company from "../../companies/models/company.js";
import  Brand from "../../companies/models/brand.js";

class PayeeNameServices {
    async createPayeeName(payeeNameData) {
        try {
            const payeeName = await PayeeName.create(payeeNameData);

            const created = await PayeeName.findByPk(payeeName.id, {
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

            return created;
        } catch (error) {
            throw error;
        }
    }

    async getPayeeNames(offset = 0, limit = 10, filters = null) {
        try {
            let whereClause = {};

            if (filters) {
                whereClause = filtersParser(filters);
            }

            const { rows: payeeNames, count: totalCount } =
                await PayeeName.findAndCountAll({
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
                    where: whereClause,
                    limit,
                    offset,
                    order: [["id", "DESC"]],
                    distinct: true,
                });

            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: payeeNames,
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

    async updatePayeename(id, payload) {
        try {

            const [count] = await PayeeName.update(payload, {
                where: { id },
                returning: true,
            });

            if (count === 0) {
                throw new APIError("Payee name not found", 404);
            }

            const updatedPayeeName = await PayeeName.findByPk(id, {
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

            return updatedPayeeName;
        } catch (err) {
            throw err;
        }
    }

    async deletePayeename(id) {
        try {
            const isDeleted = await PayeeName.destroy({
                where: { id },
            });

            if (!isDeleted) {
                throw new APIError(
                    "Failed to delete payeename or it's already deleted",
                    404
                );
            }

            return isDeleted;
        } catch (err) {
            throw err;
        }
    }
}

export default new PayeeNameServices();
