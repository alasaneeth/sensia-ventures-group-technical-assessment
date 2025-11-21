import { createAxiosInstance } from "./axiosSettings";

// API endpoints for product variations
const PRODUCT_VARIATION_ENDPOINTS = {
    ADD_PRODUCT_VARIATION: "api/product-variations",
    GET_PRODUCT_VARIATIONS: "api/product-variations",
    GET_PRODUCT_VARIATION_BY_ID: "api/product-variations/:id",
    UPDATE_PRODUCT_VARIATION: "api/product-variations/:id",
    DELETE_PRODUCT_VARIATION: "api/product-variations/:id",
};

// Create axios instance with base configuration
const productVariationApi = createAxiosInstance();

/**
 * Get all product variations with pagination and filters
 * @param {number} page - Page number
 * @param {number} rows_per_page - Number of rows per page
 * @param {Object} filters - Filter criteria (optional)
 * @param {Object} sort - Sort criteria (optional) { sortBy, dir }
 * @returns {Promise<Object>} Product variations with pagination info
 */
export async function getProductVariations(
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

        const response = await productVariationApi.get(
            PRODUCT_VARIATION_ENDPOINTS.GET_PRODUCT_VARIATIONS,
            { params }
        );

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
 * Get a single product variation by ID
 * @param {number} productVariationId - Product variation ID
 * @returns {Promise<Object>} Product variation data
 */
export async function getProductVariationById(productVariationId) {
    try {
        const response = await productVariationApi.get(
            PRODUCT_VARIATION_ENDPOINTS.GET_PRODUCT_VARIATION_BY_ID.replace(
                ":id",
                productVariationId
            )
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
 * Create a new product variation
 * @param {Object} productVariationData - Product variation data
 * @param {number} productVariationData.productId - Product ID
 * @param {string} productVariationData.code - Variation code
 * @param {string} productVariationData.variation - Variation name (optional)
 * @param {string} productVariationData.programTime - Program time (optional)
 * @param {string} productVariationData.posology - Posology (optional)
 * @param {string} productVariationData.description - Description (optional)
 * @param {number} productVariationData.pricingPerItem - Pricing per item (optional)
 * @param {string} productVariationData.formulaProductVariationFromLaboratory - Laboratory status (optional)
 * @param {string} productVariationData.supplementFacts - Supplement facts (optional)
 * @param {string} productVariationData.currency - Currency (optional)
 * @param {string} productVariationData.instructions - Instructions (optional)
 * @param {string} productVariationData.upcCode - UPC code (optional)
 * @param {string} productVariationData.manufacturedDescription - Manufactured description (optional)
 * @param {string} productVariationData.frontClaims - Front claims (optional)
 * @param {string} productVariationData.fdaStatements - FDA statements (optional)
 * @param {number} productVariationData.brandId - Brand ID (optional)
 * @returns {Promise<Object>} Created product variation data
 */
export async function createProductVariation(productVariationData) {
    try {
        const response = await productVariationApi.post(
            PRODUCT_VARIATION_ENDPOINTS.ADD_PRODUCT_VARIATION,
            productVariationData
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
 * Update a product variation
 * @param {number} productVariationId - Product variation ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated product variation data
 */
export async function updateProductVariation(productVariationId, updateData) {
    try {
        const response = await productVariationApi.patch(
            PRODUCT_VARIATION_ENDPOINTS.UPDATE_PRODUCT_VARIATION.replace(
                ":id",
                productVariationId
            ),
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
 * Delete a product variation
 * @param {number} productVariationId - Product variation ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteProductVariation(productVariationId) {
    try {
        const response = await productVariationApi.delete(
            PRODUCT_VARIATION_ENDPOINTS.DELETE_PRODUCT_VARIATION.replace(
                ":id",
                productVariationId
            )
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
