import { createAxiosInstance } from "./axiosSettings";

// Create axios instance for client API
const clientApi = createAxiosInstance();

// Define client API endpoints
const CLIENT_ENDPOINTS = {
    GET_CLIENTS: "/api/clients",
    GET_FILTERED_CLIENTS: "/api/clients/not-extracted",
    CREATE_CLIENT: "/api/clients",
    GET_CLIENT_BY_ID: (id) => `/api/clients/${id}`,
    UPDATE_CLIENT: (id) => `/api/clients/${id}`,
    DELETE_CLIENT: (id) => `/api/clients/${id}`,
    GET_CLIENT_COUNTRIES: "/api/clients/countries",
    SEARCH: "/api/clients/offers",
    IMPORT_CLIENT: "/api/clients/import",
    IMPORT_HISTORY: "/api/clients/import-history",
};

/**
 * Get clients with pagination
 * @param {number} page - Page number (starts from 1)
 * @param {number} limit - Number of items per page
 * @param {Object} filters - Additional filters to apply (e.g. {country: 'USA'})
 * @returns {Promise<Object>} - Promise with clients data and pagination info
 */
export async function getClients(
    page = 1,
    limit = 10,
    filters = {},
    sort = {}
) {
    try {
        console.log(filters);
        let params = { page, rows_per_page: limit, ...filters };
        if (sort) params = { ...params, ...sort };
        const response = await clientApi.get(CLIENT_ENDPOINTS.GET_CLIENTS, {
            params,
        });

        const { success, message = "", data, pagination } = response.data;

        if (success)
            return {
                data,
                pagination,
            };
        else return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Get clients that are not enrolled in a specific campaign
 * @param {number} page - Page number (starts from 1)
 * @param {number} limit - Number of items per page
 * @param {number} campaignId - Campaign ID to filter against
 * @param {Object} filters - Additional filters to apply (e.g. {country: 'USA'})
 * @returns {Promise<Object>} - Promise with filtered clients data and pagination info
 */
export async function getFilteredClients(
    page = 1,
    limit = 10,
    campaignId,
    filters = {},
    sort = {}
) {
    try {
        const response = await clientApi.get(
            CLIENT_ENDPOINTS.GET_FILTERED_CLIENTS,
            {
                params: {
                    page,
                    rows_per_page: limit,
                    campaign_id: campaignId,
                    ...filters,
                    ...(sort?.sortBy ? sort : {}),
                },
            }
        );

        const { success, message = "", data, pagination } = response.data;

        if (success)
            return {
                data,
                pagination,
            };
        else return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Create a new client
 * @param {Object} clientData - Client data to create
 * @returns {Promise<Object>} - Promise with created client data
 */
export async function createClient(clientData) {
    try {
        const response = await clientApi.post(
            CLIENT_ENDPOINTS.CREATE_CLIENT,
            clientData
        );

        const { success, message = "", data } = response.data;

        if (success) return data;
        else return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Get client by ID
 * @param {number|string} id - Client ID
 * @returns {Promise<Object>} - Promise with client data
 */
export async function getClientById(id) {
    try {
        const response = await clientApi.get(
            CLIENT_ENDPOINTS.GET_CLIENT_BY_ID(id)
        );

        const { success, message = "", data } = response.data;

        if (success) return data;
        else return message;
    } catch (error) {
        throw error;
    }
}


// /**
//  * Search for client offer by the code
//  * @param {string} searchValue - Value to search for (data entry code)
//  * @param {number} page - Page number (starts from 1)
//  * @param {number} rows_per_page - Number of items per page
//  * @returns {Promise<Object>} - Promise with search result
//  */
// export async function searchForClientOffer(
//     searchValue,
//     page = 1,
//     rows_per_page = 10
// ) {
//     try {
//         if (!searchValue) {
//             throw new Error("Search value is required");
//         }

//         const params = new URLSearchParams();
//         params.append("page", page);
//         params.append("rows_per_page", rows_per_page);
//         params.append("code", searchValue)

//         const response = await clientApi.get(
//             `${CLIENT_ENDPOINTS.SEARCH}?${params.toString()}`
//         );

//         const { success, message = "", data, pagination } = response.data;

//         if (success) return { data, pagination };

//         return message;
//     } catch (error) {
//         console.error(`Error searching client offer: `, error);
//         throw error;
//     }
// }

// export async function searchByClientChainOffer(clientId, offerId) {
//     try {
//         const response = await clientApi.get(`${CLIENT_ENDPOINTS.SEARCH}`, {
//             params: {
//                 client: clientId,
//                 offer: offerId,
//             },
//         });

//         const { success, message = "", data } = response.data;

//         if (success) return data;

//         return message;
//     } catch (error) {
//         console.error(
//             `Error searching client offer by client, chain and offer:`,
//             error
//         );
//         throw error;
//     }
// }

/**
 * Update client data
 * @param {number|string} id - Client ID
 * @param {Object} clientData - Data to update
 * @returns {Promise<Object>} - Promise with updated client data
 */
export async function updateClient(id, clientData) {
    try {
        const response = await clientApi.patch(
            `${CLIENT_ENDPOINTS.UPDATE_CLIENT(id)}`,
            { data: clientData }
        );

        const { success, message = "", data } = response.data;

        if (success) return data;

        return message;
    } catch (error) {
        console.error("Error updating client:", error);
        throw error;
    }
}

/**
 * Upload a file for client database import
 * @param {FormData} formData - FormData object containing the file to upload
 * @returns {Promise<Object>} - Import history record
 */
export async function uploadImportedFile(formData) {
    try {
        const response = await clientApi.post(
            CLIENT_ENDPOINTS.IMPORT_CLIENT,
            formData,
            {
                headers: {
                    // Don't set Content-Type header, let axios set it with the boundary
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        const { success, message, data } = response.data;

        if (success) {
            return data;
        } else {
            throw new Error(message || "Failed to upload file");
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

/**
 * Get import history records
 * @returns {Promise<Array>} - Array of import history records
 */
export async function getImportHistory({ page = 1, rowsPerPage = 10, filters = undefined }) {
    try {
        const params = {
            page,
            rows_per_page: rowsPerPage,
        };

        // Add filters to params under filter umbrella object if provided
        if (filters) {
            params.filter = filters;
        }

        const response = await clientApi.get(CLIENT_ENDPOINTS.IMPORT_HISTORY, {
            params,
        });

        const { success, message, data, pagination } = response.data;

        if (success) return { data, pagination };

        return message;
    } catch (error) {
        console.error("Error fetching import history:", error);
        throw error;
    }
}

export default clientApi;
