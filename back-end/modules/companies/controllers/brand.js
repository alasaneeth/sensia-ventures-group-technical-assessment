import APIError from "../../../utils/APIError.js";
import brandServices from "../services/brand.js";

class BrandControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addBrand(req, res, next) {
        try {
            const { name, description } = req?.body;
            const { companyId } = req?.params;

            if (!name) {
                return next(
                    new APIError("Name is required", 400, "NAME_REQUIRED")
                );
            }

            const brand = await brandServices.createBrand(companyId, name, description);

            res.status(201).json({
                success: true,
                message: "Brand created successfully",
                data: brand,
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
    async getBrand(req, res, next) {
        try {
            const { id } = req?.params;

            const brand = await brandServices.getBrandById(id);

            return res.status(200).json({
                success: true,
                data: brand,
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
    async getBrands(req, res, next) {
        try {
            const { companyId } = req?.params;
            // Get the rows_per_page, page, and filters from the search params
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

            const brands = await brandServices.getBrandsByCompanyId(
                companyId,
                offset,
                maxLimit,
                filters
            );

            res.status(200).json({
                success: true,
                data: brands.data,
                pagination: brands.pagination,
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
    async updateBrand(req, res, next) {
        try {
            const { payload } = req?.body;
            const { id } = req?.params;

            const updatedBrand = await brandServices.updateBrand(id, payload);

            return res.status(200).json({
                success: true,
                message: "Brand updated successfully",
                data: updatedBrand,
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
    async deleteBrand(req, res, next) {
        try {
            const { id } = req?.params;

            await brandServices.deleteBrand(id);

            return res.status(200).json({
                success: true,
                message: "Brand deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new BrandControllers();

