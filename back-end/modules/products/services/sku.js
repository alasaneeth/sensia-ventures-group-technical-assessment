import Sku from "../models/sku.js";
import ProductVariation from "../../products/models/productVariation.js";
import APIError from "../../../utils/APIError.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import Brand from "../../companies/models/brand.js";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Company from "../../companies/models/company.js";

class SkuServices {
    /**
     * Create a new SKU
     * @param {Object} skuData - SKU data
     * @returns {Promise<Object>} Created SKU
     */
    async createSku(skuData) {
        try {
            const { brandId, productVariationId } = skuData;

            // check the brand and product
            const brand = await Brand.findByPk(brandId);
            if (!brand) {
                throw new APIError(
                    "There is no brand with the given Id",
                    404,
                    "BRAND_NOT_FOUND"
                );
            }

            const productVariation = await ProductVariation.findByPk(
                productVariationId
            );
            if (!productVariation) {
                throw new APIError(
                    "There is no product variation with the given Id",
                    404,
                    "PRODUCT_VARIATION_NOT_FOUND"
                );
            }

            // Create SKU in the database
            const sku = await Sku.create(skuData);

            return sku;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get SKUs with pagination and filtering
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Maximum number of records to return
     * @param {Object} filters - Filter criteria (optional)
     * @returns {Promise<Object>} SKUs with pagination info
     */
    async getSkus(
        offset = 0,
        limit = 10,
        filters = null,
        sortField = null,
        sortDirection = null
    ) {
        let whereClause = {};
        let sort = [["id", "DESC"]];

        if (sortField && sortDirection) {
            if (sortField === "priceToPay") {
                // Sort by calculated value: price - discount
                sort = [
                    [Sku.sequelize.literal("price - discount"), sortDirection],
                ];
            } else {
                sort = [[sortField, sortDirection]];
            }
        }
        console.log(
            "\n######## this is from the sku table ########\n",
            sort,
            "\n################\n"
        );

        if (filters) {
            whereClause = filtersParser(filters);
        }

        try {
            // Get SKUs with pagination and associations
            const { rows: skus, count: totalCount } = await Sku.findAndCountAll(
                {
                    offset,
                    limit,
                    where: whereClause,
                    include: [
                        {
                            model: ProductVariation,
                            as: "productVariation",
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
                    order: sort,
                }
            );

            // Calculate pagination info
            const pages = Math.ceil(totalCount / limit);

            return {
                skus,
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
     * Get a single SKU by ID
     * @param {number|string} skuId - SKU ID
     * @returns {Promise<Object>} SKU details
     */
    async getSkuById(skuId) {
        try {
            const sku = await Sku.findByPk(skuId, {
                include: [
                    {
                        model: ProductVariation,
                        as: "productVariation",
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
            });

            if (!sku) {
                throw new APIError("SKU not found", 404, "SKU_NOT_FOUND");
            }

            return sku;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Update a SKU
     * @param {number|string} skuId - SKU ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated SKU
     */
    async updateSku(skuId, updateData) {
        try {
            // Update the SKU
            const [, [newSku]] = await Sku.update(updateData, {
                where: { id: skuId },
                returning: true,
            });

            return newSku;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Delete a SKU
     * @param {number|string} skuId - SKU ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteSku(skuId) {
        try {
            // Delete the SKU
            const deletedCount = await Sku.destroy({
                where: {
                    id: skuId,
                },
            });

            if (!deletedCount) {
                throw new APIError(
                    "The sku is either deleted or not found",
                    404,
                    "SKU_NOT_FOUND"
                );
            }

            return deletedCount;
        } catch (err) {
            throw err;
        }
    }
}

export default new SkuServices();
