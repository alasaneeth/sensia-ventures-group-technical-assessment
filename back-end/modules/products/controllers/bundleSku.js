import APIError from "../../../utils/APIError.js";
import bundleSkuServices from "../services/bundleSku.js";

class BundleSkuControllers {
    /**
     * Add a new Bundle SKU
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addBundleSku(req, res, next) {
        try {
            const { brandId, code, name, description, price, discount, currency, skus } = req.body;

            if (!code) {
                throw new APIError(
                    "Bundle Code is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            if (!brandId) {
                throw new APIError(
                    "The brand is required",
                    400,
                    "MISSING_DATA"
                );
            }

            // Send the data to Bundle SKU service
            const bundleSku = await bundleSkuServices.createBundleSku({
                brandId,
                code,
                name,
                description,
                price,
                discount,
                currency,
                skus,
            });

            // Return the response to the client
            res.status(201).json({
                success: true,
                data: bundleSku,
                message: "Bundle SKU created successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Delete a Bundle SKU
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async deleteBundleSku(req, res, next) {
        try {
            const { id } = req.params;

            // Validate ID
            if (!id) {
                throw new APIError("SKU ID is required", 400, "MISSING_ID");
            }

            // Delete Bundle SKU via service
            await bundleSkuServices.deleteBundleSku(id);

            // Return the response
            res.status(200).json({
                success: true,
                message: "Bundle SKU deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get Bundle SKU by ID
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getBundleSkuById(req, res, next) {
        try {
            const { id } = req.params;

            // Validate ID
            if (!id) {
                throw new APIError("SKU ID is required", 400, "MISSING_ID");
            }

            // Get Bundle SKU from service
            const bundleSku = await bundleSkuServices.getBundleSkuById(id);

            // Return the response
            res.status(200).json({
                success: true,
                data: bundleSku,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get all Bundle SKUs with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getBundleSkus(req, res, next) {
        try {
            // Get query parameters for pagination
            const { offset, limit } = req?.pagination;

            // Get filters from req if available
            const filters = req.query.filters || null;
            // Extract sorting parameters
            const sortField = req.query.sortField;
            const sortDirection = req.query.sortDirection || "ASC";
            console.log('\n####### Bundle SKU filter field #########\n', sortField, '\n################\n');
            console.log('\n####### Bundle SKU filter direction #########\n', sortDirection, '\n################\n');

            // Get Bundle SKUs from service
            const result = await bundleSkuServices.getBundleSkus(
                offset,
                limit,
                filters,
                sortField,
                sortDirection
            );

            // Return the response
            res.status(200).json({
                success: true,
                data: result.bundleSkus,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update a Bundle SKU
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateBundleSku(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "Bundle SKU ID is required",
                    400,
                    "MISSING_ID"
                );
            }

            // Update Bundle SKU via service
            const bundleSku = await bundleSkuServices.updateBundleSku(
                id,
                updateData
            );

            // Return the response
            res.status(200).json({
                success: true,
                data: bundleSku,
                message: "Bundle SKU updated successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new BundleSkuControllers();
