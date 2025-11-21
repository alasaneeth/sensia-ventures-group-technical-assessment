import { createAxiosInstance } from "./axiosSettings";

// API endpoints for campaigns
const CAMPAIGN_ENDPOINTS = {
    GET_CAMPAIGNS: "/api/campaigns",
    CREATE_CAMPAIGN: "/api/campaigns",
    GET_CAMPAIGN_BY_ID: (id) => `/api/campaigns/${id}`,
    ATTACH_CHAIN: (campaignId) => `/api/campaigns/${campaignId}/chains`,
    GET_KEYCODES: (campaignId) => `/api/campaigns/${campaignId}/keycodes`,
    CREATE_KEY: `/api/campaigns/:campaignId/keycodes`, // id of the campaign
    EXTRACT_CAMPAIGN: "/api/campaigns/:campaignId/extract",
    GET_LAST_CAM_CHAIN: "/api/campaigns/offers/:offerId/",
    GET_PAYEE_NAME: (campaignId, offerId) => `/api/campaigns/${campaignId}/offers/${offerId}/payeename`,

    GET_PAYMENT_METHODS_BY_COUNTRY: "/api/payment-methods/:country",
    UPDATE_CAMPAIGN: "/api/campaigns/:id",
    ADD_PAYMENT_METHOD: "/api/payment-methods",
    UPDATE_PAYMENT_METHOD: "/api/payment-methods/:id",
    GET_PAYMENT_METHODS: "/api/payment-methods",
    DELETE_CAMPAIGN: "/api/campaigns/:id",
};

// Create axios instance with base configuration
const campaignApi = createAxiosInstance();

/**
 * Fetch campaigns with pagination
 * @param {number} page - Page number (starts from 1)
 * @param {number} rowsPerPage - Number of rows per page
 * @param {boolean} filter - Whether to filter campaigns that have unenrolled clients
 * @returns {Promise<Object>} - Promise with campaigns data and pagination info
 */
export async function fetchCampaigns({
    page = 1,
    rowsPerPage = 10,
    filters = null,
    sortField = null,
    sortDirection = null,
    include = 1,
}) {
    try {
        console.log(
            "\n##########taKING ######\n",
            filters,
            "\n##########sort field######\n",
            sortField,
            "\n##########sort direction######\n",
            sortDirection,
            "\n#######extra#########\n"
        );

        const params = {
            page,
            rows_per_page: rowsPerPage,
            ...(include ? include : {}),
        };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        // Add sorting parameters if provided
        if (sortField) {
            params.sortField = sortField;
            params.sortDirection = sortDirection || "ASC";
        }

        const response = await campaignApi.get(
            CAMPAIGN_ENDPOINTS.GET_CAMPAIGNS,
            { params }
        );

        const { success, message = "", data, pagination } = response.data;

        if (success)
            return {
                data, // The campaigns data
                pagination, // The pagination info
            };
        else return message;
    } catch (error) {
        throw error;
    }
}

export async function getPaymentMethodByCountry(country) {
    try {
        const response = await campaignApi.get(
            CAMPAIGN_ENDPOINTS.GET_PAYMENT_METHODS_BY_COUNTRY.replace(
                ":country",
                country
            )
        );

        const { data, success, message = "" } = response.data;

        if (success) return data;
        else return message;
    } catch (err) {
        throw err;
    }
}

/**
 * Create a new campaign
 * @param {Object} campaignData - Campaign data object
 * @param {string} campaignData.title - Campaign title
 * @param {string} campaignData.description - Campaign description
 * @param {Date} campaignData.start_date - Campaign start date
 * @param {Date} campaignData.end_date - Campaign end date
 * @param {string} campaignData.status - Campaign status
 * @returns {Promise<Object>} - Promise with created campaign data
 */
export async function createCampaign(campaignData) {
    try {
        const response = await campaignApi.post(
            CAMPAIGN_ENDPOINTS.CREATE_CAMPAIGN,
            campaignData
        );

        const { success, message = "", data } = response.data;

        if (success) return data; // The campaign data
        else return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Fetch campaign details with associated chains
 * @param {number|string} id - Campaign ID
 * @param {number} page - Page number for chains pagination
 * @param {number} limit - Number of chains per page
 * @returns {Promise<Object>} - Promise with campaign data, chains, and pagination
 */
export async function fetchCampaignDetails(id) {
    try {
        const response = await campaignApi.get(
            `${CAMPAIGN_ENDPOINTS.GET_CAMPAIGNS}/${id}`
        );

        const { success, message = "", data, chains } = response.data;

        if (success)
            return {
                data,
                chains,
            };
        else return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Fetch campaign by ID for editing
 * @param {number|string} id - Campaign ID
 * @returns {Promise<Object>} - Promise with campaign data including chain offers
 */
export async function fetchCampaignById(id) {
    try {
        const response = await campaignApi.get(
            CAMPAIGN_ENDPOINTS.GET_CAMPAIGN_BY_ID(id)
        );

        const { success, message = "", data } = response.data;

        if (success) return data;
        else return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Get key codes for a campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<Array>} - Promise with key codes data
 */
export async function getKeyCodes(campaignId) {
    try {
        const response = await campaignApi.get(
            CAMPAIGN_ENDPOINTS.GET_KEYCODES(campaignId)
        );

        const { success, message = "", data } = response.data;

        if (success) return data;
        else return message;
    } catch (error) {
        throw error;
    }
}

export async function updateCampaign(campaignId, data) {
    try {
        const response = await campaignApi.patch(
            CAMPAIGN_ENDPOINTS.UPDATE_CAMPAIGN.replace(":id", campaignId),
            data
        );

        const { success, message = "" } = response.data;

        if (success) return success;

        return message;
    } catch (error) {
        throw error;
    }
}

//// Payment methods
export async function getPaymentMethods(page = 1, rows_per_page = 10, filters = null) {
    try {
        const params = {
            page,
            rows_per_page,
        };

        if (filters) {
            params.filters = filters;
        }

        const response = await campaignApi.get(
            CAMPAIGN_ENDPOINTS.GET_PAYMENT_METHODS,
            { params }
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

export async function updatePaymentMethod(paymentMethodId, data) {
    try {
        const response = await campaignApi.patch(
            CAMPAIGN_ENDPOINTS.UPDATE_PAYMENT_METHOD.replace(
                ":id",
                paymentMethodId
            ),
            data
        );

        const { success, message = "" } = response.data;

        return { success, message };
    } catch (error) {
        throw error;
    }
}

export async function createPaymentMethod(data) {
    try {
        const response = await campaignApi.post(
            CAMPAIGN_ENDPOINTS.ADD_PAYMENT_METHOD,
            data
        );

        const { success, message = "" } = response.data;

        return { success, message };
    } catch (error) {
        throw error;
    }
}

/**
 * Get campaign key codes segmentations
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<Array>} - Promise with key codes segmentation data
 */
export async function getCampaignKeyCodesSegmentations(campaignId) {
    try {
        const response = await campaignApi.get(
            `/api/campaigns/keycodes/${campaignId}`
        );

        const { success, message = "", data } = response.data;

        if (success) return data;
        else return message;
    } catch (error) {
        throw error;
    }
}

export async function deleteCampaign(campaignId) {
    try {
        const response = await campaignApi.delete(
            CAMPAIGN_ENDPOINTS.DELETE_CAMPAIGN.replace(":id", campaignId)
        );

        const { success, message = "" } = response.data;

        if (!success) return message;

        return { success, message };
    } catch (error) {
        throw error;
    }
}

/**
 * Extract clients in a campaign
 * @param {Array|null} clients - Array of client objects or null for filter-based enrollment
 * @param {number} campaignId - ID of the campaign
 * @param {Object} filters - Filter object for filter-based enrollment (optional)
 * @param {string} keyCode - Key code for extraction (optional)
 * @param {string} keyCodeDescription - Description for the key code (optional)
 * @param {string} listName - List name for the segmentation (optional)
 * @returns {Promise<Object>} - Promise with enrollment result
 */
export async function createKey(
    campaignId,
    offerId,
    filters = null,
    keyCodeDescription = null,
    listName = null
) {
    try {
        const payload = {
            offerId,
        };

        // Add keyCode to payload if provided
        // if (keyCode) {
        //     payload.keyCode = keyCode;
        // }

        // Add keyCodeDescription to payload if provided
        if (keyCodeDescription) {
            payload.keyCodeDescription = keyCodeDescription;
        }

        // Add listName to payload if provided
        if (listName) {
            payload.listName = listName;
        }

        // If clients is null, use filter-based enrollment
        if (filters) {
            payload.filters = filters;
        }

        const response = await campaignApi.post(
            CAMPAIGN_ENDPOINTS.CREATE_KEY.replace(":campaignId", campaignId),
            payload
        );

        const { success, message = "" } = response.data;

        return { success, message };
    } catch (error) {
        throw error;
    }
}

/**
 * Extract segmented clients to campaign
 * @param {number} campaignId - ID of the campaign
 * @returns {Promise<Object>} - Promise with extraction result
 */
export async function extractCampaign(campaignId) {
    try {
        const response = await campaignApi.post(
            CAMPAIGN_ENDPOINTS.EXTRACT_CAMPAIGN.replace(
                ":campaignId",
                campaignId
            )
        );

        const { success, message = "", count } = response.data;

        if (success) return { message, count };
        else return message;
    } catch (error) {
        throw error;
    }
}

export async function getLastCamChain(offerId) {
    try {
        const response = await campaignApi.get(
            `${CAMPAIGN_ENDPOINTS.GET_LAST_CAM_CHAIN.replace(
                /:offerId/,
                offerId
            )}`
        );
        console.log("\n################\n", response, "\n################\n");
        const { success, message, data } = response.data;

        if (success && !message) {
            return data;
        }

        return message;
    } catch (err) {
        throw err;
    }
}

/**
 * Get payee name for a specific campaign and offer
 * @param {number} campaignId - Campaign ID
 * @param {number} offerId - Offer ID
 * @returns {Promise<Object>} - Promise with payee name data (id and name)
 */
export async function getPayeeNameForOffer(campaignId, offerId) {
    try {
        const response = await campaignApi.get(
            CAMPAIGN_ENDPOINTS.GET_PAYEE_NAME(campaignId, offerId)
        );

        const { success, message = "", data } = response.data;

        if (success) return data;
        else return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Fetch payee name for a campaign and offer, handling the full flow
 * @param {number} campaignId - Campaign ID
 * @param {number} offerId - Offer ID
 * @param {Function} setSelectedPayee - State setter for selected payee
 * @returns {Promise<void>}
 */
export async function fetchPayeeName(campaignId, offerId, setSelectedPayee) {
    if (campaignId && offerId) {
        try {
            const response = await getPayeeNameForOffer(campaignId, offerId);
            // Auto-select the fetched payee
            if (response?.name) {
                setSelectedPayee(response.name);
            }
        } catch (error) {
            console.error("Error fetching payee name:", error);
            setSelectedPayee(null);
        }
    } else {
        setSelectedPayee(null);
    }
}
