import { createAxiosInstance } from "./axiosSettings";

// API endpoints for products
const PRODUCT_ENDPOINTS = {
    ADD_PRODUCT: "api/products",
    GET_PRODUCTS: "api/products",
    GET_PRODUCT_BY_ID: "api/products/:id",
    UPDATE_PRODUCT: "api/products/:id",
    DELETE_PRODUCT: "api/products/:id",
};

// Create axios instance with base configuration
const productApi = createAxiosInstance();

/**
 * Get all products with pagination and filters
 * @param {number} page - Page number
 * @param {number} rows_per_page - Number of rows per page
 * @param {Object} filters - Filter criteria (optional)
 * @param {Object} sort - Sort criteria (optional) { sortBy, dir }
 * @returns {Promise<Object>} Products with pagination info
 */
export async function getProducts(
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

        const response = await productApi.get(PRODUCT_ENDPOINTS.GET_PRODUCTS, {
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
 * Get a single product by ID
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Product data
 */
export async function getProductById(productId) {
    try {
        const response = await productApi.get(
            PRODUCT_ENDPOINTS.GET_PRODUCT_BY_ID.replace(":id", productId)
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
 * Create a new product
 * @param {Object} productData - Product data
 * @param {Array} productData.categoryId - Array of category IDs
 * @param {string} productData.name - Product name
 * @param {string} productData.code - Product code
 * @param {number} productData.internalCode - Internal code
 * @param {string} productData.representation - Product representation (optional)
 * @param {number} productData.brandId - Brand ID
 * @returns {Promise<Object>} Created product data
 */
export async function createProduct(productData) {
    try {
        const response = await productApi.post(
            PRODUCT_ENDPOINTS.ADD_PRODUCT,
            productData
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
 * Update a product
 * @param {number} productId - Product ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated product data
 */
export async function updateProduct(productId, updateData) {
    try {
        const response = await productApi.patch(
            PRODUCT_ENDPOINTS.UPDATE_PRODUCT.replace(":id", productId),
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
 * Delete a product
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteProduct(productId) {
    try {
        const response = await productApi.delete(
            PRODUCT_ENDPOINTS.DELETE_PRODUCT.replace(":id", productId)
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
