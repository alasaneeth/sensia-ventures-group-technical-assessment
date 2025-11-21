import APIError from "../../../utils/APIError.js";
import companyServices from "../services/company.js";

class CompanyControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addCompany(req, res, next) {
        try {
            const { name, description } = req?.body;

            if (!name) {
                return next(
                    new APIError("Name is required", 400, "NAME_REQUIRED")
                );
            }

            const company = await companyServices.createCompany(name, description);

            res.status(201).json({
                success: true,
                message: "Company created successfully",
                data: company,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getCompany(req, res, next) {
        try {
            const { id } = req?.params;

            const company = await companyServices.getCompanyById(id);

            return res.status(200).json({
                success: true,
                data: company,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getCompanies(req, res, next) {
        try {
            // Get the rows_per_page, page, and country from the search params
            const page = parseInt(req.query.page) || 1;
            const rowsPerPage = parseInt(req.query.rows_per_page) || 10;
            const filters = req?.query?.filters;

            // Validate pagination parameters
            if (page < 1 || rowsPerPage < 1) {
                return next(
                    new APIError(
                        "Invalid pagination parameters",
                        400,
                        "INVALID_PAGINATION"
                    )
                );
            }

            // Calculate offset and limit for database query
            const offset = (page - 1) * rowsPerPage;
            const limit = rowsPerPage;

            const maxLimit = Math.min(limit, 200);

            const companies = await companyServices.getCompanies(
                offset,
                maxLimit,
                filters
            );

            res.status(200).json({
                success: true,
                data: companies.data,
                pagination: companies.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateCompany(req, res, next) {
        try {
            const { payload } = req?.body;
            const { id } = req?.params;

            const updatedCompany = await companyServices.updateCompany(id, payload);

            return res.status(200).json({
                success: true,
                message: "Company updated successfully",
                data: updatedCompany,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async deleteCompany(req, res, next) {
        try {
            const { id } = req?.params;

            await companyServices.deleteCompany(id);

            return res.status(200).json({
                success: true,
                message: "Company deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getBrandsForCompanies(req, res, next) {
        try {
            const { companies } = req?.body;

            if (!companies || !Array.isArray(companies) || companies.length === 0) {
                return next(
                    new APIError(
                        "Companies array is required",
                        400,
                        "COMPANIES_REQUIRED"
                    )
                );
            }

            const brands = await companyServices.getBrandsForCompanies(companies);

            return res.status(200).json({
                success: true,
                data: brands,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new CompanyControllers();

