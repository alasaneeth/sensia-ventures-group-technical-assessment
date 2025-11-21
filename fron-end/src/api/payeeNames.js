import { createAxiosInstance } from "./axiosSettings";

// API endpoints for orders
const PAYEENAMES_ENDPOINTS = {
    ADD_PAYEE_NAME: "/api/payeenames",
    GET_PAYEE_NAMES: "/api/payeenames",
    DELETE_PAYEE_NAME: "/api/payeenames/:id",
    UPDATE_PAYEE_NAME: "/api/payeenames/:id",
};

// Create axios instance with base configuration
const payeeNamesApi = createAxiosInstance();

export async function getPayeeNames(
    page = 0,
    rows_per_page = 10,
    filters = null
) {
    try {
        const params = { page, rows_per_page };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        const response = await payeeNamesApi.get(
            PAYEENAMES_ENDPOINTS.GET_PAYEE_NAMES,
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

export async function createPayeeName(payeeNameData) {
    try {
        const response = await payeeNamesApi.post(
            PAYEENAMES_ENDPOINTS.ADD_PAYEE_NAME,
            payeeNameData
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

export async function updatePayeename(id, payload) {
    try {
        const request = await payeeNamesApi.patch(
            PAYEENAMES_ENDPOINTS.UPDATE_PAYEE_NAME.replace(":id", id),
            payload
        );

        const { success, data, message } = request.data;

        if (success) {
            return data;
        }

        console.error(message);

        return message;
    } catch (err) {
        throw err;
    }
}

export async function deletePayeeName(id) {
    try {
        const request = await payeeNamesApi.delete(
            PAYEENAMES_ENDPOINTS.DELETE_PAYEE_NAME.replace(":id", id)
        );

        const {success, message} = request.data;

        if(success) return success;

        return message;
    } catch (err) {
        throw err;
    }
}
