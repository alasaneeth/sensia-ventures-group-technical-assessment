import BundleSku from "../models/bundleSku.js";
import SkuBundleSku from "../models/skuBundleSku.js";
import Sku from "../models/sku.js";
import ProductVariation from "../models/productVariation.js";
import APIError from "../../../utils/APIError.js";
import { Op } from "sequelize";
import { filtersParser } from "../../../utils/filterParsers.js";
import sequelize from "../../../config/sequelize.js";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Brand from "../../companies/models/brand.js";
import Company from "../../companies/models/company.js";

class BundleSkuServices {
    /**
     * Create a new Bundle SKU
     * @param {Object} bundleData - Bundle SKU data
     * @param {Array} bundleData.skus - Array of {skuId, quantity, sortOrder, notes}
     * @returns {Promise<Object>} Created Bundle SKU
     */
    async createBundleSku(bundleData) {
        const transaction = await sequelize.transaction();

        try {
            // Take the skus IDs from the object
            const { skus, brandId } = bundleData;
            delete bundleData.skus;

            const brand = await Brand.findByPk(brandId);

            if (!brand) {
                throw new APIError(
                    "The brand isn't existed.",
                    404,
                    "NOT_FOUND"
                );
            }

            // Create the bundle sku first
            const bundleSku = await BundleSku.create(bundleData, {
                transaction,
            });

            // Prepare the object
            const skuBundleSkuToCreate = skus.map((sku) => ({
                bundleSkuId: bundleSku.id,
                skuId: sku.skuId,
            }));

            // Create the relations
            await SkuBundleSku.bulkCreate(skuBundleSkuToCreate, {
                transaction,
            });

            // Commit the transaction
            await transaction.commit();

            // Return the created bundle sku
            return bundleSku;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    /**
     * Get Bundle SKUs with pagination and filtering
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Maximum number of records to return
     * @param {Object} filters - Filter criteria (optional)
     * @returns {Promise<Object>} Bundle SKUs with pagination info
     */
    async getBundleSkus(
        offset = 0,
        limit = 10,
        filters = null,
        sortField = null,
        sortDirection = "ASC"
    ) {
        let whereClause = {};
        let sort = [["id", "DESC"]];

        if (filters) {
            whereClause = filtersParser(filters);
        }

        if (sortField && sortDirection) {
            if (sortField === "priceToPay") {
                // Sort by calculated value: price - discount (virtual field)
                sort = [
                    [
                        BundleSku.sequelize.literal(
                            '"BundleSku".price - "BundleSku".discount'
                        ),
                        sortDirection,
                    ],
                ];
            } else if (sortField === "price") {
                // Explicitly reference bundle_skus.price when sorting by price
                sort = [
                    [
                        BundleSku.sequelize.col('"BundleSku".price'),
                        sortDirection,
                    ],
                ];
            } else if (sortField === "discount") {
                // Explicitly reference bundle_skus.discount when sorting by discount
                sort = [
                    [
                        BundleSku.sequelize.col('"BundleSku".discount'),
                        sortDirection,
                    ],
                ];
            } else {
                sort = [[sortField, sortDirection]];
            }
        }

        try {
            // Get Bundle SKUs with pagination
            const { rows: bundleSkus, count: totalCount } =
                await BundleSku.findAndCountAll({
                    offset,
                    limit,
                    distinct: true,
                    order: sort,
                    where: whereClause,
                    include: [
                        {
                            model: Sku,
                            as: "skus",
                            through: {
                                attributes: [],
                            },
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

            // Calculate pagination info
            const pages = Math.ceil(totalCount / limit);

            return {
                bundleSkus,
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
     * Get a single Bundle SKU by ID
     * @param {number|string} bundleSkuId - Bundle SKU ID
     * @returns {Promise<Object>} Bundle SKU details
     */
    async getBundleSkuById(bundleSkuId) {
        try {
            const bundleSku = await BundleSku.findByPk(bundleSkuId, {
                distinct: true,
                include: [
                    {
                        model: Sku,
                        as: "skus",
                        through: {
                            attributes: [],
                        },
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

            if (!bundleSku) {
                throw new APIError(
                    "Bundle SKU not found",
                    404,
                    "BUNDLE_SKU_NOT_FOUND"
                );
            }

            return bundleSku;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Update a Bundle SKU
     * @param {number|string} bundleSkuId - Bundle SKU ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated Bundle SKU
     */
    async updateBundleSku(bundleSkuId, updateData) {
        const transaction = await sequelize.transaction();
        try {
            const { skus, ...bundleFields } = updateData;

            await BundleSku.update(bundleFields, {
                where: { id: bundleSkuId },
                transaction,
            });

            if (Array.isArray(skus)) {
                await SkuBundleSku.destroy({
                    where: { bundleSkuId },
                    transaction,
                });

                if (skus.length > 0) {
                    const relations = skus.map((sku) => ({
                        bundleSkuId,
                        skuId: sku.skuId,
                    }));

                    await SkuBundleSku.bulkCreate(relations, { transaction });
                }
            }

            await transaction.commit();

            return getBundleSkuById(bundleSkuId);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
    /**
     * Delete a Bundle SKU
     * @param {number|string} bundleSkuId - Bundle SKU ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteBundleSku(bundleSkuId) {
        try {
            // Delete the Bundle SKU (cascade will delete bundle_sku_items)
            const deletedCount = await BundleSku.destroy({
                where: {
                    id: bundleSkuId,
                },
            });

            if (!deletedCount) {
                throw new APIError(
                    "Bundle SKU is either deleted or not exists",
                    404,
                    "BUNDLE_SKU_NOT_FOUND"
                );
            }

            return deletedCount;
        } catch (err) {
            throw err;
        }
    }
}

export default new BundleSkuServices();
