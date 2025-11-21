import APIError from "../../../utils/APIError.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import Company from "../models/company.js";
import Brand from "../models/brand.js";

class CompanyServices {
    async createCompany(name, description = null) {
        try {
            const company = await Company.create({ name, description });

            return company;
        } catch (error) {
            throw error;
        }
    }

    async getCompanyById(id) {
        try {
            const company = await Company.findByPk(id);

            if (!company) {
                throw new APIError("Company not found", 404, "COMPANY_NOT_FOUND");
            }

            return company;
        } catch (error) {
            throw error;
        }
    }

    async getCompanies(offset = 0, limit = 10, filters = null) {
        let whereClause = null;
        if (filters) {
            whereClause = { where: { ...filtersParser(filters) } };
        }

        try {
            const { rows: companies, count: totalCount } =
                await Company.findAndCountAll({
                    limit,
                    offset,
                    order: [["id", "DESC"]],
                    ...(whereClause ? whereClause : {}),
                });

            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: companies,
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

    async updateCompany(id, payload) {
        try {
            const [_, updatedCompanies] = await Company.update(payload, {
                where: { id },
                returning: true,
            });

            if (!updatedCompanies || updatedCompanies.length === 0) {
                throw new APIError(
                    "Company not found",
                    404,
                    "COMPANY_NOT_FOUND"
                );
            }

            return updatedCompanies[0];
        } catch (err) {
            throw err;
        }
    }

    async deleteCompany(id) {
        try {
            const isDeleted = await Company.destroy({
                where: { id },
            });

            if (!isDeleted) {
                throw new APIError(
                    "Failed to delete company or it's already deleted",
                    404
                );
            }

            return isDeleted;
        } catch (err) {
            throw err;
        }
    }

    async getBrandsForCompanies(companyIds) {
        try {
            const brands = await Brand.findAll({
                where: {
                    companyId: companyIds,
                },
                order: [["name", "ASC"]],
            });

            return brands;
        } catch (err) {
            throw err;
        }
    }
}

export default new CompanyServices();

