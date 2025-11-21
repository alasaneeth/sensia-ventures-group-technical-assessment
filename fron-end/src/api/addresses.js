import { createAxiosInstance } from "./axiosSettings";

// API endpoints for orders
const ADDRESSES_ENDPOINTS = {
    ADD_ADDRESS: "/api/addresses",
    GET_ADDRESS: "/api/addresses",
    UPDATE_ADDRESS: "/api/addresses/:id",
    CREATE_SHIPMENT: "/api/addresses/shipments",
    GET_SHIPMENTS: "/api/addresses/shipments",
    GET_SHIPMENT: `/api/addresses/shipments/:id`,
    UPDATE_SHIPMENT: `/api/addresses/shipments/:id`,
    ADD_SHIPMENT: `/api/addresses/:id/shipments`,
    UPDATE_OFFERS_RETURN_ADDRESSES: "/api/addresses/:id/offers"
};

// Create axios instance with base configuration
const addressesApi = createAxiosInstance();

export async function getAddresses(
    page = 0,
    rows_per_page = 10,
    filters = null,
    order = null
) {
    try {
        const params = { page, rows_per_page };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        if(order) {
            params.order = order;
        }

        console.log('\n######## filters for addresses ########\n', params.filters,'\n################\n');

        const response = await addressesApi.get(
            ADDRESSES_ENDPOINTS.GET_ADDRESS,
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

export async function createAddress(addressData) {
    try {
        const response = await addressesApi.post(
            ADDRESSES_ENDPOINTS.ADD_ADDRESS,
            {data: addressData}
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

export async function updateAddress(id, addressData) {
    try {
        const response = await addressesApi.patch(
            ADDRESSES_ENDPOINTS.UPDATE_ADDRESS.replace(":id", id),
            {data: addressData}
        );

        const { success, data, message } = response.data;

        if (success) {
            return data;
        }

        console.error(message);
        return message;
    } catch (err) {
        throw err;
    }
}

/**
 * Create a new shipment
 * @param {Object} shipmentData - Shipment data
 * @returns {Promise<Object>} - Created shipment
 */
export async function createShipment(shipmentData) {
    try {
        const response = await addressesApi.post(
            ADDRESSES_ENDPOINTS.CREATE_SHIPMENT,
            shipmentData
        );

        const { success, message, data } = response.data;

        if (!success) {
            return message || "Failed to create shipment";
        }

        return data;
    } catch (err) {
        console.error("Error creating shipment:", err);
        throw err;
    }
}

/**
 * Get all shipments with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} - Shipments data with pagination
 */
export async function getShipments(page = 1, limit = 10, filters = null, order=null) {
    try {
        const params = { page, rows_per_page: limit };

        if (filters) {
            params.filters = filters;
        }

        if (order) {
            params.order = order;
        }

        const response = await addressesApi.get(
            ADDRESSES_ENDPOINTS.GET_SHIPMENTS,
            { params }
        );

        const { success, message, data, pagination } = response.data;

        if (!success) {
            return message || "Failed to fetch shipments";
        }

        return { data, pagination };
    } catch (err) {
        console.error("Error fetching shipments:", err);
        throw err;
    }
}

/**
 * Get a single shipment by ID
 * @param {number} id - Shipment ID
 * @returns {Promise<Object>} - Shipment data
 */
export async function addShipment(id, data) {
    try {
        const response = await addressesApi.post(
            ADDRESSES_ENDPOINTS.ADD_SHIPMENT.replace(":id", id),
            { data }
        );

        const { success, message } = response.data;

        return success
    } catch (err) {
        console.error("Error adding shipment:", err);
        throw err;
    }
}

/**
 * Update a shipment
 * @param {number} id - Shipment ID
 * @param {Object} shipmentData - Updated shipment data
 * @returns {Promise<Object>} - Updated shipment
 */
export async function updateShipment(id, shipmentData) {
    try {
        const response = await addressesApi.patch(
            ADDRESSES_ENDPOINTS.UPDATE_SHIPMENT.replace(":id", id),
            { data: shipmentData }
        );

        const { success, message, data} = response.data;

        if (!success) {
            return message || "Failed to update shipment";
        }

        return data;
    } catch (err) {
        console.error("Error updating shipment:", err);
        throw err;
    }
}

export async function updatOffersAddresses(id, newAddressId) {
    try {
        const response = await addressesApi.patch(
            ADDRESSES_ENDPOINTS.UPDATE_OFFERS_RETURN_ADDRESSES.replace(":id", id),
            { data: { newAddressId } }
        );

        const { success, message } = response.data;

        return success
    } catch(err) {
        console.error("Error updating offers addresses:", err);
        throw err
    }
}