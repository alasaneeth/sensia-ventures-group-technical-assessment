import { createAxiosInstance } from "./axiosSettings";

// API endpoints for SKUs
const SKU_ENDPOINTS = {
    ADD_SKU: "api/skus",
    GET_SKUS: "api/skus",
    GET_SKU_BY_ID: "api/skus/:id",
    UPDATE_SKU: "api/skus/:id",
    DELETE_SKU: "api/skus/:id",
};

// Create axios instance with base configuration
const skuApi = createAxiosInstance();

/**
 * Get all SKUs with pagination and filters
 * @param {number} page - Page number
 * @param {number} rows_per_page - Number of rows per page
 * @param {Object} filters - Filter criteria (optional)
 * @param {Object} sort - Sort criteria (optional) { sortBy, dir }
 * @returns {Promise<Object>} SKUs with pagination info
 */
export async function getSkus(
    page = 0,
    rows_per_page = 10,
    filters = null,
    sort = null
) {
    try {
        const params = { page, rows_per_page };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        // Add sorting parameters if provided
        if (sort) {
            params.sortField = sort.sortBy;
            params.sortDirection = sort.dir;
        }

        const response = await skuApi.get(SKU_ENDPOINTS.GET_SKUS, {
            params,
        });

        const { success, pagination, data, message } = response.data;

        if (success) {
            return { pagination, data };
        }

        console.error(message);

        return message;
    } catch (err) {
        throw err;
    }
}

/**
 * Get a single SKU by ID
 * @param {number} skuId - SKU ID
 * @returns {Promise<Object>} SKU data
 */
export async function getSkuById(skuId) {
    try {
        const response = await skuApi.get(
            SKU_ENDPOINTS.GET_SKU_BY_ID.replace(":id", skuId)
        );

        const { success, data, message } = response.data;

        if (success) {
            return { data };
        }

        console.error(message);

        return message;
    } catch (err) {
        throw err;
    }
}

/**
 * Create a new SKU
 * @param {Object} skuData - SKU data
 * @param {string} skuData.code - SKU code
 * @param {number} skuData.brandId - Brand ID
 * @param {number} skuData.productVariationId - Product Variation ID
 * @param {string} skuData.upsell - Upsell (optional)
 * @param {number} skuData.quantity - Quantity (optional)
 * @param {string} skuData.qtyDetail - Quantity detail (optional)
 * @param {string} skuData.description - Description (optional)
 * @param {number} skuData.price - Price (optional)
 * @param {string} skuData.currency - Currency (optional)
 * @param {number} skuData.discount - Discount (optional)
 * @param {string} skuData.rule - Rule (optional)
 * @param {boolean} skuData.ifGiftVisible - If gift visible (optional)
 * @returns {Promise<Object>} Created SKU data
 */
export async function createSku(skuData) {
    try {
        const response = await skuApi.post(
            SKU_ENDPOINTS.ADD_SKU,
            skuData
        );

        const { success, data, message } = response.data;

        if (success) {
            return { data };
        }

        console.error(message);

        return message;
    } catch (err) {
        throw err;
    }
}

/**
 * Update a SKU
 * @param {number} skuId - SKU ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated SKU data
 */
export async function updateSku(skuId, updateData) {
    try {
        const response = await skuApi.patch(
            SKU_ENDPOINTS.UPDATE_SKU.replace(":id", skuId),
            updateData
        );

        const { success, data, message } = response.data;

        if (success) {
            return { data };
        }

        console.error(message);

        return message;
    } catch (err) {
        throw err;
    }
}

/**
 * Delete a SKU
 * @param {number} skuId - SKU ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteSku(skuId) {
    try {
        const response = await skuApi.delete(
            SKU_ENDPOINTS.DELETE_SKU.replace(":id", skuId)
        );

        const { success, message } = response.data;

        if (success) {
            return { success };
        }

        console.error(message);

        return message;
    } catch (err) {
        throw err;
    }
}
