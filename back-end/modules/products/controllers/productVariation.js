import productVariationServices from "../services/productVariation.js";
import APIError from "../../../utils/APIError.js";

class ProductVariationControllers {
    /**
     * Add a new product variation
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addProductVariation(req, res, next) {
        try {
            // Take the data from the body
            const {
                productId,
                code,
                variation,
                programTime,
                posology,
                description,
                pricingPerItem,
                formulaProductVariationFromLaboratory,
                supplementFacts,
                currency,
                instructions,
                upcCode,
                manufacturedDescription,
                frontClaims,
                fdaStatements,
                brandId,
                name,
            } = req.body;

            // Validate required fields
            if (!productId) {
                throw new APIError(
                    "Product is required",
                    400,
                    "MISSING_PRODUCT_ID"
                );
            }

            if (!code) {
                throw new APIError("Code is required", 400, "MISSING_CODE");
            }

            // Send the data to product variation service
            const productVariation =
                await productVariationServices.createProductVariation({
                    productId,
                    code,
                    variation,
                    programTime,
                    posology,
                    description,
                    pricingPerItem,
                    formulaProductVariationFromLaboratory,
                    supplementFacts,
                    currency,
                    instructions,
                    upcCode,
                    manufacturedDescription,
                    frontClaims,
                    fdaStatements,
                    brandId,
                    name,
                });

            // Return the response to the client
            res.status(201).json({
                success: true,
                data: productVariation,
                message: "Product variation created successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Delete a product variation
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async deleteProductVariation(req, res, next) {
        try {
            const { id } = req.params;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "Invalid product variation ID",
                    400,
                    "INVALID_PRODUCT_VARIATION_ID"
                );
            }

            // Delete product variation through service
            await productVariationServices.deleteProductVariation(id);

            // Return the response to the client
            res.status(200).json({
                success: true,
                message: "Product variation deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get a single product variation by ID
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getProductVariationById(req, res, next) {
        try {
            const { id } = req.params;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "Invalid product variation ID",
                    400,
                    "INVALID_PRODUCT_VARIATION_ID"
                );
            }

            // Get product variation from service
            const productVariation =
                await productVariationServices.getProductVariationById(id);

            // Return the response to the client
            res.status(200).json({
                success: true,
                data: productVariation,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get product variations with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getProductVariations(req, res, next) {
        try {
            const { limit, offset } = req?.pagination;
            const filters = req?.query?.filters;

            // Extract sorting parameters
            const sortField = req.query.sortField;
            const sortDirection = req.query.sortDirection || "ASC";

            console.log(
                "\n####### Bundle SKU filter field #########\n",
                sortField,
                "\n################\n"
            );
            console.log(
                "\n####### Bundle SKU filter direction #########\n",
                sortDirection,
                "\n################\n"
            );

            // Get product variations from service
            const result = await productVariationServices.getProductVariations(
                offset,
                limit,
                filters,
                sortField,
                sortDirection
            );

            // Return the response to the client
            res.status(200).json({
                success: true,
                data: result.productVariations,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update a product variation
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateProductVariation(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "Invalid product variation ID",
                    400,
                    "INVALID_PRODUCT_VARIATION_ID"
                );
            }

            // Update product variation through service
            const productVariation =
                await productVariationServices.updateProductVariation(
                    id,
                    updateData
                );

            // Return the response to the client
            res.status(200).json({
                success: true,
                data: productVariation,
                message: "Product variation updated successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new ProductVariationControllers();
