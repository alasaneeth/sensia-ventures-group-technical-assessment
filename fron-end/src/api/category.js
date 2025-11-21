import { createAxiosInstance } from "./axiosSettings";

// API endpoints for categories
const CATEGORY_ENDPOINTS = {
    GET_CATEGORIES: "api/categories",
    ADD_CATEGORY: "api/categories",
    UPDATE_CATEGORY: "api/categories/:id",
    DELETE_CATEGORY: "api/categories/:id",
};

// Create axios instance with base configuration
const categoryApi = createAxiosInstance();

/**
 * Get all categories with pagination and filters
 * @param {number} page - Page number
 * @param {number} rows_per_page - Number of rows per page
 * @param {Object} filters - Filter criteria (optional)
 * @param {Object} sort - Sort criteria (optional) { sortBy, dir }
 * @returns {Promise<Object>} Categories with pagination info
 */
export async function getCategories(
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

        const response = await categoryApi.get(
            CATEGORY_ENDPOINTS.GET_CATEGORIES,
            {
                params,
            }
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
 * Create a new category
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} Created category
 */
export async function createCategory(categoryData) {
    try {
        const response = await categoryApi.post(
            CATEGORY_ENDPOINTS.ADD_CATEGORY,
            categoryData
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
 * Update a category
 * @param {number} categoryId - Category ID
 * @param {Object} categoryData - Updated category data
 * @returns {Promise<Object>} Updated category
 */
export async function updateCategory(categoryId, categoryData) {
    try {
        const response = await categoryApi.put(
            CATEGORY_ENDPOINTS.UPDATE_CATEGORY.replace(":id", categoryId),
            { data: categoryData }
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
 * Delete a category
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object>} Deleted category
 */
export async function deleteCategory(categoryId) {
    try {
        const response = await categoryApi.delete(
            CATEGORY_ENDPOINTS.DELETE_CATEGORY.replace(":id", categoryId)
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
