import APIError from "../../../utils/APIError.js";
import Country from "../models/country.js";
import { Op } from "sequelize";
import {filtersParser} from "../../../utils/filterParsers.js";
import Company from "../../companies/models/company.js";
import Brand  from "../../companies/models/brand.js";

class CountryServices {
    async createCountry(countryData) {
        try {
            const countryRecord = await Country.create(countryData);

            return countryRecord;
        } catch (err) {
            throw err;
        }
    }

    async getCountries(offset = 0, limit = 10, filters = null) {
        try {
            
            let whereClause = {};
            
            if (filters) {
                whereClause = filtersParser(filters);
            }

            const { rows: countries, count: totalCount } =
                await Country.findAndCountAll({
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
                    limit,
                    offset,
                    where: whereClause,
                    order: [["id", "DESC"]],
                    distinct: true,
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: countries,
                pagination: {
                    total: totalCount,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    async updateCountry(id, countryData) {
        try {
            const [count] = await Country.update(countryData, {
                where: { id },
                returning: true,
            });

            if (count === 0) {
                throw new APIError("Country not found", 404);
            }
            
            const updatedCountry = await Country.findByPk(id, {
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

            return updatedCountry;
        } catch (err) {
            throw err;
        }
    }

    async deleteCountry(id) {
        try {
            const isDeleted = await Country.destroy({
                where: {
                    id,
                },
            });

            if (!isDeleted)
                throw new APIError(
                    "The country isn't found or it's already deleted",
                    404
                );

            return isDeleted;
        } catch (err) {
            throw err;
        }
    }
}


export default new CountryServices();