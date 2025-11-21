import ProductVariation from "../models/productVariation.js";
import Product from "../models/product.js";
import APIError from "../../../utils/APIError.js";
import { Op } from "sequelize";
import { filtersParser } from "../../../utils/filterParsers.js";
import sequelize from "../../../config/sequelize.js";
import Brand from "../../companies/models/brand.js";
import Category from "../models/category.js";
import Company from "../../companies/models/company.js";

class ProductVariationServices {
    /**
     * Create a new product variation
     * @param {Object} variationData - Product variation data
     * @returns {Promise<Object>} Created product variation
     */
    async createProductVariation(variationData) {
        try {
            const createdVariation = await ProductVariation.create(
                variationData
            );

            return createdVariation;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get product variations with pagination and filtering
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Maximum number of records to return
     * @param {Object} filters - Filter criteria (optional)
     * @returns {Promise<Object>} Product variations with pagination info
     */
    async getProductVariations(offset = 0, limit = 10, filters = null, sortField = null, sortDirection = "ASC") {
        let whereClause = {};
        let categoryWhere = {};

        if (filters) {
            // Extract categoryIds from filters if present
            const { categoryIds, ...otherFilters } = filters;
            
            // Parse other filters normally
            if (Object.keys(otherFilters).length > 0) {
                whereClause = filtersParser(otherFilters);
            }
            
            // Handle category filter separately
            if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
                categoryWhere = {
                    id: categoryIds
                };
            }
        }

        try {
            // Determine order clause
            const orderClause = sortField
                ? [[sortField, sortDirection.toUpperCase()]]
                : [["id", "DESC"]];

            // Build category include with optional where clause
            const categoryInclude = {
                model: Category,
                as: "categories",
                through: {
                    attributes: [],
                },
            };
            
            // Add where clause to category include if filtering by categories
            if (Object.keys(categoryWhere).length > 0) {
                categoryInclude.where = categoryWhere;
                categoryInclude.required = true; // Inner join when filtering
            }

            // Build product include with category filter
            const productInclude = {
                model: Product,
                as: "product",
                include: [categoryInclude],
            };
            
            // If filtering by categories, make product required (inner join)
            if (Object.keys(categoryWhere).length > 0) {
                productInclude.required = true;
            }

            // Get product variations with pagination
            const { rows: productVariations, count: totalCount } =
                await ProductVariation.findAndCountAll({
                    offset,
                    distinct: true,
                    limit,
                    order: orderClause,
                    where: whereClause,
                    include: [
                        productInclude,
                        {
                            model: Brand,
                            as: "brand",
                            include: [
                                {
                                    model: Company,
                                    as: "company",
                                },
                            ],
                        },
                    ],
                });

            // Calculate pagination info
            const pages = Math.ceil(totalCount / limit);

            return {
                productVariations,
                pagination: {
                    total: totalCount,
                    pages,
                    page: Math.floor(offset / limit) + 1,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get a single product variation by ID
     * @param {number|string} variationId - Product variation ID
     * @returns {Promise<Object>} Product variation details
     */
    async getProductVariationById(variationId) {
        try {
            const productVariation = await ProductVariation.findByPk(
                variationId,
                {
                    include: [
                        {
                            model: Product,
                            as: "product",
                            include: [
                                {
                                    model: Category,
                                    as: "categories",
                                    through: {
                                        attributes: [],
                                    },
                                },
                            ],
                        },
                        {
                            model: Brand,
                            as: "brand",
                            include: [
                                {
                                    model: Company,
                                    as: "company",
                                },
                            ],
                        },
                    ],
                }
            );

            if (!productVariation) {
                throw new APIError(
                    "Product variation not found",
                    404,
                    "PRODUCT_VARIATION_NOT_FOUND"
                );
            }

            return productVariation;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Update a product variation
     * @param {number|string} variationId - Product variation ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated product variation
     */
    async updateProductVariation(variationId, updateData) {
        try {
            // Update the product variation
            await ProductVariation.update(updateData, {
                where: { id: variationId },
            });

            // Get all details
            return this.getProductVariationById(variationId);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Delete a product variation
     * @param {number|string} variationId - Product variation ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteProductVariation(variationId) {
        try {
            // Check if product variation exists
            const productVariation = await ProductVariation.findByPk(
                variationId
            );

            if (!productVariation) {
                throw new APIError(
                    "Product variation not found",
                    404,
                    "PRODUCT_VARIATION_NOT_FOUND"
                );
            }

            // Delete the product variation
            await productVariation.destroy();

            return true;
        } catch (err) {
            throw err;
        }
    }
}

export default new ProductVariationServices();
