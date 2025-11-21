import productServices from "../services/product.js";
import APIError from "../../../utils/APIError.js";

class ProductControllers {
    /**
     * Add a new product
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addProduct(req, res, next) {
        try {
            // Take the data from the body
            const {
                categoryId,
                name,
                code,
                internalCode,
                representation,
                brandId,
            } = req.body;

            // Validate required fields
            if (!categoryId || !Array.isArray(categoryId) || categoryId.length === 0) {
                throw new APIError(
                    "Category is required and must be an array",
                    400,
                    "MISSING_CATEGORY_ID"
                );
            }

            if (!brandId) {
                throw new APIError(
                    "Brand is required",
                    400,
                    "MISSING_BRAND_ID"
                );
            }

            // Send the data to product service
            const product = await productServices.createProduct({
                categoryId,
                name,
                code,
                internalCode,
                representation,
                brandId,
            });

            // Return the response to the client
            res.status(201).json({
                success: true,
                data: product,
                message: "Product created successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Delete a product
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "Invalid product ID",
                    400,
                    "INVALID_PRODUCT_ID"
                );
            }

            // Delete product through service
            await productServices.deleteProduct(id);

            // Return the response to the client
            res.status(200).json({
                success: true,
                message: "Product deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get a single product by ID
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getProductById(req, res, next) {
        try {
            const { id } = req.params;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "Invalid product ID",
                    400,
                    "INVALID_PRODUCT_ID"
                );
            }

            // Get product from service
            const product = await productServices.getProductById(id);

            // Return the response to the client
            res.status(200).json({
                success: true,
                data: product,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get products with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getProducts(req, res, next) {
        try {
            const { limit, offset } = req?.pagination;
            const filters = req?.query?.filters;
            
            // Extract sorting parameters
            const sortField = req.query.sortField;
            const sortDirection = req.query.sortDirection || "ASC";

            // Get products from service
            const result = await productServices.getProducts(
                offset,
                limit,
                filters,
                sortField,
                sortDirection
            );

            // Return the response to the client
            res.status(200).json({
                success: true,
                data: result.products,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update a product
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate ID
            if (!id) {
                throw new APIError(
                    "Invalid product ID",
                    400,
                    "INVALID_PRODUCT_ID"
                );
            }

            // Update product through service
            const product = await productServices.updateProduct(id, updateData);

            // Return the response to the client
            res.status(200).json({
                success: true,
                data: product,
                message: "Product updated successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new ProductControllers();
