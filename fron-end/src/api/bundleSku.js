import { createAxiosInstance } from "./axiosSettings";

// API endpoints for Bundle SKUs
const BUNDLE_SKU_ENDPOINTS = {
    ADD_BUNDLE_SKU: "api/bundle-skus",
    GET_BUNDLE_SKUS: "api/bundle-skus",
    GET_BUNDLE_SKU_BY_ID: "api/bundle-skus/:id",
    UPDATE_BUNDLE_SKU: "api/bundle-skus/:id",
    DELETE_BUNDLE_SKU: "api/bundle-skus/:id",
};

// Create axios instance with base configuration
const bundleSkuApi = createAxiosInstance();

/**
 * Get all Bundle SKUs with pagination and filters
 * @param {number} page - Page number
 * @param {number} rows_per_page - Number of rows per page
 * @param {Object} filters - Filter criteria (optional)
 * @param {Object} sort - Sort criteria (optional) { sortBy, dir }
 * @returns {Promise<Object>} Bundle SKUs with pagination info
 */
export async function getBundleSkus(
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

        const response = await bundleSkuApi.get(BUNDLE_SKU_ENDPOINTS.GET_BUNDLE_SKUS, {
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
 * Get a single Bundle SKU by ID
 * @param {number} bundleSkuId - Bundle SKU ID
 * @returns {Promise<Object>} Bundle SKU data
 */
export async function getBundleSkuById(bundleSkuId) {
    try {
        const response = await bundleSkuApi.get(
            BUNDLE_SKU_ENDPOINTS.GET_BUNDLE_SKU_BY_ID.replace(":id", bundleSkuId)
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
 * Create a new Bundle SKU
 * @param {Object} bundleData - Bundle SKU data
 * @param {string} bundleData.code - Bundle code
 * @param {number} bundleData.brandId - Brand ID
 * @param {string} bundleData.description - Description (optional)
 * @param {Array} bundleData.skus - Array of SKU objects with skuId
 * @returns {Promise<Object>} Created Bundle SKU data
 */
export async function createBundleSku(bundleData) {
    try {
        const response = await bundleSkuApi.post(
            BUNDLE_SKU_ENDPOINTS.ADD_BUNDLE_SKU,
            bundleData
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
 * Update a Bundle SKU
 * @param {number} bundleSkuId - Bundle SKU ID
 * @param {Object} updateData - Data to update
 * @param {Array} updateData.skus - Array of SKU objects with skuId (optional)
 * @returns {Promise<Object>} Updated Bundle SKU data
 */
export async function updateBundleSku(bundleSkuId, updateData) {
    try {
        const response = await bundleSkuApi.patch(
            BUNDLE_SKU_ENDPOINTS.UPDATE_BUNDLE_SKU.replace(":id", bundleSkuId),
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
 * Delete a Bundle SKU
 * @param {number} bundleSkuId - Bundle SKU ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteBundleSku(bundleSkuId) {
    try {
        const response = await bundleSkuApi.delete(
            BUNDLE_SKU_ENDPOINTS.DELETE_BUNDLE_SKU.replace(":id", bundleSkuId)
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
