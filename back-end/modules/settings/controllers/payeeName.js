import APIError from "../../../utils/APIError.js";
import payeeNameServices from "../services/payeeName.js"

class PayeeNameControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addPayeeName(req, res, next) {
        try {
            const { name, companyId, brandId } = req?.body;

            if (!name) {
                return next(
                    new APIError("Name is required", 400, "NAME_REQUIRED")
                );
            }

            if (!brandId) {
                return next(
                    new APIError("Brand is required", 400, "MISSING_BRAND")
                );
            }

            const payeeName = await payeeNameServices.createPayeeName({
                name,
                brandId, // companyId is accepted from frontend but not stored
            });

            res.status(201).json({
                success: true,
                data: payeeName,
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
    async deletePayeename(req, res, next) {
        try {
            const { id } = req?.params;

            await payeeNameServices.deletePayeename(id);

            return res.status(200).json({
                success: true,
                message: "Payee name deleted successfully",
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
    async getPayeeNames(req, res, next) {
        try {
            // Get the rows_per_page, page, and country from the search params
            const page = parseInt(req.query.page) || 1;
            const rowsPerPage = parseInt(req.query.rows_per_page) || 10;
            let filters = req?.query?.filters;
            
            // Handle both string and object cases
            if (filters && typeof filters === 'string') {
                filters = JSON.parse(filters);
            }

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

            const payeeNames = await payeeNameServices.getPayeeNames(
                offset,
                maxLimit,
                filters
            );

            res.status(200).json({
                success: true,
                data: payeeNames.data,
                pagination: payeeNames.pagination,
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
    async updatePayeename(req, res, next) {
        try {
            const { payload } = req?.body;
            const { id } = req?.params;
            
            // Extract companyId from payload if present (ignore it)
            const { companyId, ...updateData } = payload || {};
            
            // If brandId is provided, use it; otherwise keep existing
            const finalPayload = updateData;

            const newPayeeName = await payeeNameServices.updatePayeename(id, finalPayload);

            return res.status(200).json({
                success: true,
                data: newPayeeName,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new PayeeNameControllers();
