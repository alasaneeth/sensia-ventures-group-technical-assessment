import { createAxiosInstance } from "./axiosSettings";

// API endpoints for orders
const ORDER_ENDPOINTS = {
    PLACE_ORDER: "/api/orders",
    GET_ORDERS: "/api/orders",
    PLACE_ORDER_NOT_SELECTED: "/api/orders/not-selected",
    GET_SUMMARY: "/api/orders/summary",
    DELETE_ORDER: "/api/orders/:id",
    UPDATE_ORDER: "/api/orders/:id",
};

// Create axios instance with base configuration
const orderApi = createAxiosInstance();

/**
 * Place an order
 * @param {Object} orderData - Order data
 * @param {number} orderData.clientOfferId - Client offer ID
 * @param {number} orderData.cashAmount - Cash amount for the order
 * @param {string} orderData.offerCode - Offer code for verification
 * @returns {Promise<Object>} - Promise with order data
 */
export async function placeOrder(orderData) {
    try {
        console.log("\n################\n", "WHAT ?", "\n################\n");
        const response = await orderApi.post(
            ORDER_ENDPOINTS.PLACE_ORDER,
            orderData
        );

        const { success, message } = response.data;

        if (!success) return message;

        return success;
    } catch (error) {
        console.error("Error placing order:", error);
        throw error;
    }
}

/**
 * Get orders with pagination
 * @param {number} page - Page number (starts from 1)
 * @param {number} rowsPerPage - Number of rows per page
 * @returns {Promise<Object>} - Promise with orders data and pagination info
 */
export async function getOrders(page = 1, rowsPerPage = 10, filters = null) {
    try {
        const params = {
            page,
            rows_per_page: rowsPerPage,
        };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        const response = await orderApi.get(ORDER_ENDPOINTS.GET_ORDERS, {
            params,
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
}

/**
 * Place an order
 * @param {Object} orderData - Order data
 * @param {number} orderData.clientOfferId - Client offer ID
 * @param {number} orderData.cashAmount - Cash amount for the order
 * @param {string} orderData.offerCode - Offer code for verification
 * @returns {Promise<Object>} - Promise with order data
 */
export async function placeOrderNotSelected(orderData) {
    try {
        const response = await orderApi.post(
            ORDER_ENDPOINTS.PLACE_ORDER_NOT_SELECTED,
            orderData
        );
        const { success, message } = response.data;

        if (!success) return message;

        return success;
    } catch (error) {
        console.error("Error placing order:", error);
        throw error;
    }
}

/**
 * Get orders summary with pagination
 * @param {number} page - Page number (starts from 1)
 * @param {number} rowsPerPage - Number of rows per page
 * @returns {Promise<Object>} - Promise with orders summary data and pagination info
 */
export async function getOrdersSummary(page = 1, rowsPerPage = 10, filters) {
    try {
        let params = { page, rows_per_page: rowsPerPage };

        if (filters) {
            params.filters = filters;
        }

        const response = await orderApi.get(ORDER_ENDPOINTS.GET_SUMMARY, {
            params,
        });

        return response.data;
    } catch (err) {
        console.error("Error fetching orders summary:", err);
        throw err;
    }
}

export async function deleteOrder(id) {
    try {
        const response = await orderApi.delete(
            ORDER_ENDPOINTS.DELETE_ORDER.replace(":id", id)
        );
        const { success, message } = response.data;

        if (!success) return message;

        return success;
    } catch (err) {
        console.error("Error deleting order:", err);
        throw err;
    }
}

export async function updateOrder(id, data) {
    try {
        const response = await orderApi.patch(
            ORDER_ENDPOINTS.UPDATE_ORDER.replace(":id", id),
            { data }
        );
        const { success, data: newOrder, message } = response.data;

        if (success) return { newOrder };

        return message;
    } catch (err) {
        console.error("Error updating order:", err);
        throw err;
    }
}

export default orderApi;
