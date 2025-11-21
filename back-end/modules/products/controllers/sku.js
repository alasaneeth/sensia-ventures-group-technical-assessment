import APIError from "../../../utils/APIError.js";
import skuServices from "../services/sku.js";

class SkuControllers {
    /**
     * Add a new SKU
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addSku(req, res, next) {
        try {
            const {
                code,
                brandId,
                upsell,
                productVariationId,
                quantity,
                qtyDetail,
                description,
                price,
                currency,
                discount,
                rule,
                ifGiftVisible,
                name,
            } = req.body;

            if (!code) {
                throw new APIError(
                    "SKU Code is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }
            if (!brandId) {
                throw new APIError(
                    "Brand ID is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }
            if (!productVariationId) {
                throw new APIError(
                    "Product Variation ID is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            // Send the data to SKU service
            const sku = await skuServices.createSku({
                code,
                brandId,
                upsell,
                productVariationId,
                quantity,
                qtyDetail,
                description,
                price,
                currency,
                discount,
                rule,
                ifGiftVisible,
                name,
            });

            // Return the response to the client
            res.status(201).json({
                success: true,
                data: sku,
                message: "SKU created successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Delete a SKU
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async deleteSku(req, res, next) {
        try {
            const { id } = req.params;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "SKU ID is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            // Delete SKU via service
            await skuServices.deleteSku(id);

            // Return the response
            res.status(200).json({
                success: true,
                message: "SKU deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get SKU by ID
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getSkuById(req, res, next) {
        try {
            const { id } = req.params;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "SKU ID is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            // Get SKU from service
            const sku = await skuServices.getSkuById(id);

            // Return the response
            res.status(200).json({
                success: true,
                data: sku,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get all SKUs with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getSkus(req, res, next) {
        try {
            // Get query parameters for pagination
            const { limit, offset } = req?.pagination;
            // Get filters from req if available
            const filters = req?.query?.filters || null;
            // Extract sorting parameters
            const sortField = req.query.sortField;
            const sortDirection = req.query.sortDirection || "ASC";
            console.log(
                "\n####### SKU sort field #########\n",
                sortField,
                "\n################\n"
            );
            console.log(
                "\n####### SKU sort direction #########\n",
                sortDirection,
                "\n################\n"
            );

            // Get SKUs from service
            const result = await skuServices.getSkus(
                offset,
                limit,
                filters,
                sortField,
                sortDirection
            );

            // Return the response
            res.status(200).json({
                success: true,
                data: result.skus,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update a SKU
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateSku(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "SKU ID is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            // Update SKU via service
            const sku = await skuServices.updateSku(id, updateData);

            // Return the response
            res.status(200).json({
                success: true,
                data: sku,
                message: "SKU updated successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new SkuControllers();
