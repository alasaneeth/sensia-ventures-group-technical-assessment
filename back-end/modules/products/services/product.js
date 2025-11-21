import Product from "../models/product.js";
import APIError from "../../../utils/APIError.js";
import { Op } from "sequelize";
import { filtersParser } from "../../../utils/filterParsers.js";
import ProductCategory from "../models/prouctCategory.js";
import sequelize from "../../../config/sequelize.js";
import Brand from "../../companies/models/brand.js";
import Category from "../models/category.js";
import Company from "../../companies/models/company.js";

class ProductServices {
    /**
     * Create a new product
     * @param {Object} productData - Product data
     * @param {string} productData.client - Client name
     * @param {string} productData.productUniverse - Product universe
     * @param {number} productData.categoryId - Category ID
     * @param {string} productData.productName - Product name
     * @param {string} productData.productCode - Product code (unique)
     * @param {number} productData.internalCode - Internal code
     * @param {string} productData.productRepresentation - Product representation (optional)
     * @param {number} productData.brandId - Brand ID
     * @returns {Promise<Object>} Created product
     */
    async createProduct(productData) {
        const transaction = await sequelize.transaction();
        try {
            // Extract category and brand IDs
            const { categoryId, ...productDataWithoutRelations } = productData;

            // Create product in the database
            const product = await Product.create(productDataWithoutRelations, {
                transaction,
            });

            // Create ProductCategory records for each category ID
            if (
                categoryId &&
                Array.isArray(categoryId) &&
                categoryId.length > 0
            ) {
                const productCategoryRecords = categoryId.map((catId) => ({
                    productId: product.id,
                    categoryId: catId,
                }));

                await ProductCategory.bulkCreate(productCategoryRecords, {
                    transaction,
                });
            }

            // Commit transaction
            await transaction.commit();

            return product;
        } catch (err) {
            // Rollback transaction on error
            await transaction.rollback();
            throw err;
        }
    }

    /**
     * Get products with pagination and filtering
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Maximum number of records to return
     * @param {Object} filters - Filter criteria (optional)
     * @returns {Promise<Object>} Products with pagination info
     */
    async getProducts(offset = 0, limit = 10, filters = null, sortField = null, sortDirection = "ASC") {
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

            // Get products with pagination
            const { rows: products, count: totalCount } =
                await Product.findAndCountAll({
                    include: [
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
                        categoryInclude,
                    ],
                    offset,
                    distinct: true,
                    limit,
                    order: orderClause,
                    where: whereClause,
                });

            // Calculate pagination info
            const pages = Math.ceil(totalCount / limit);

            return {
                products,
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
     * Get a single product by ID
     * @param {number|string} productId - Product ID
     * @returns {Promise<Object>} Product details
     */
    async getProductById(productId) {
        try {
            const product = await Product.findByPk(productId, {
                include: [
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
                    {
                        model: Category,
                        as: "categories",
                        through: {
                            attributes: [],
                        },
                    },
                ],
            });

            if (!product) {
                throw new APIError(
                    "Product not found",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            return product;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Update a product
     * @param {number|string} productId - Product ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated product
     */
    async updateProduct(productId, updateData) {
        const transaction = await sequelize.transaction();
        try {
            const { categoryId: categoryIds, ...productFields } = updateData;

            const [affectedCount] = await Product.update(productFields, {
                where: { id: productId },
                transaction,
            });

            if (!affectedCount) {
                throw new APIError(
                    "Product not found",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            if (Array.isArray(categoryIds)) {
                await ProductCategory.destroy({
                    where: { productId },
                    transaction,
                });

                if (categoryIds.length > 0) {
                    const records = categoryIds.map((categoryId) => ({
                        productId,
                        categoryId,
                    }));

                    await ProductCategory.bulkCreate(records, {
                        transaction,
                    });
                }
            }

            await transaction.commit();

            return this.getProductById(productId);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    /**
     * Delete a product
     * @param {number|string} productId - Product ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteProduct(productId) {
        try {
            // Delete the product
            const deletedCount = await Product.destroy({
                where: { id: productId },
            });

            if (!deletedCount)
                throw new APIError(
                    "The product is either deleted or not found.",
                    404,
                    "NOT_FOUND"
                );

            return true;
        } catch (err) {
            throw err;
        }
    }
}

export default new ProductServices();
