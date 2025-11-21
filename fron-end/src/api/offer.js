import { asyncThunkCreator } from "@reduxjs/toolkit";
import { createAxiosInstance } from "./axiosSettings";

// API endpoints for offers
const OFFER_ENDPOINTS = {
    GET_OFFERS: "/api/offers",
    CREATE_OFFER: "/api/offers",
    CREATE_CHAIN: "/api/offers/chains",
    GET_CHAINS: "/api/offers/chains",
    GET_OFFER: "/api/offers/:id",
    GET_EXPORTATION_OFFERS: "/api/offers/exportation",
    EXPORT_OFFERS: "/api/offers/exportation",
    GET_FUTURE_EXPORTATION_OFFERS: "/api/offers/exportation/future-exportation",
    GET_EXPORTS_HISTORY: "/api/offers/exportation/history",
    IMPORT_OFFER: "/api/offers/import",
    GET_EXPORTED_OFFER_FILE: "/api/offers/exportation/:id",
    DELETE_OFFER: "/api/offers/:id",
    UPDATE_OFFER: "/api/offers/:id",
    DELETE_CHAIN: "/api/offers/chains/:id",
    UPDATE_CHAIN: "/api/offers/chains/:id",
    GET_CHAIN_OFFERS: "/api/offers/chains/:id/offers",
    GET_CLIENT_SERVICES: "api/offers/client-services",
    GET_MAIL_FILES: "/api/offers/mail-files",

    SEARCH: "/api/offers/mail-files/search",
};

// Create axios instance with base configuration
const offerApi = createAxiosInstance();

/**
 * Fetch campaigns with pagination
 * @param {number} page - Page number (starts from 1)
 * @param {number} rowsPerPage - Number of rows per page
 * @param {string} country - Optional country filter
 * @returns {Promise<Object>} - Promise with campaigns data and pagination info
 */
export async function fetchOffers(
    page = 1,
    rowsPerPage = 10,
    takeNotInChain = true,
    filters = null,
    orFields = null,
    sort = null
) {
    try {
        const response = await offerApi.get(OFFER_ENDPOINTS.GET_OFFERS, {
            params: {
                page,
                rows_per_page: rowsPerPage,
                include_not_in_chain: Number(takeNotInChain),
                ...(filters !== null ? filters : {}), // Only include if filters are provided
                ...(orFields ? { orFields } : {}),
                ...(sort
                    ? { sortField: sort.sortBy, sortDirection: sort.dir }
                    : {}), // Add sorting parameters
            },
        });

        const { success, message = "", data, pagination } = response.data;

        if (success)
            return {
                data, // The campaigns data
                pagination, // The pagination info
            };
        return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Create a new offer
 * @param {Object} offerData - Offer data object
 * @returns {Promise<Object>} - Promise with created offer data
 */
export async function createOffer(offerData) {
    try {
        const response = await offerApi.post(
            OFFER_ENDPOINTS.CREATE_OFFER,
            offerData
        );

        const { success, message = "", data } = response.data;

        if (success) {
            return data; // The offer data
        } else {
            // If the API returns success: false, throw an error with the message
            throw new Error(message || "Failed to create offer");
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Create a new offer chain
 * @param {string} title - Chain title
 * @param {string} description - Chain description
 * @param {Object} offers - Object with offer connections in format: { offerId: [{ offer_id, days_to_add }] }
 * @param {string} firstOffer - ID of the first offer in the chain
 * @param {Array} offerReturnAddresses - Array of objects with offerId and returnAddress properties
 * @param {number} companyId - Company ID
 * @param {number} brandId - Brand ID (optional)
 * @returns {Promise<Object>} - Promise with created chain data
 */
export async function createChain(
    title,
    description,
    offers,
    firstOffer,
    offerReturnAddresses,
    companyId,
    brandId
) {
    try {
        const response = await offerApi.post(OFFER_ENDPOINTS.CREATE_CHAIN, {
            title,
            description,
            offers,
            firstOffer,
            offerReturnAddresses,
            companyId,
            brandId,
        });

        const { success, message = "", data } = response.data;

        if (success) return data; // The chain data
        else return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Fetch offer chains with pagination
 * @param {number} page - Page number (starts from 1)
 * @param {number} rowsPerPage - Number of rows per page
 * @returns {Promise<Object>} - Promise with chains data and pagination info
 */
export async function fetchChains(page = 1, rowsPerPage = 10, filters = null) {
    try {
        const params = {
            page,
            rows_per_page: rowsPerPage,
        };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        const response = await offerApi.get(OFFER_ENDPOINTS.GET_CHAINS, {
            params,
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching chains:", error);
        throw error;
    }
}

/**
 * Fetch a specific chain with all its offer sequences
 * @param {number} chainId - Chain ID
 * @returns {Promise<Object>} - Promise with chain data and offer sequences
 */
export async function fetchChainById(chainId) {
    try {
        const response = await offerApi.get(
            `${OFFER_ENDPOINTS.GET_CHAINS}/${chainId}`
        );

        const { success, data, message } = response.data;

        if (success) {
            return data;
        } else {
            return message;
        }
    } catch (error) {
        console.error("Error fetching chain by ID:", error);
        throw error;
    }
}

export async function fetchOfferData(id) {
    try {
        const response = await offerApi.get(
            `${OFFER_ENDPOINTS.GET_OFFER.replace(":id", id)}`
        );

        const { success, data, message } = response.data;

        if (success) {
            return data;
        } else {
            return message;
        }
    } catch (error) {
        console.error("Error fetching offer by ID:", error);
        throw error;
    }
}

// Get the printer records
export async function fetchExportationOffers(
    page = 1,
    rowsPerPage = 10,
    filters = null
) {
    try {
        const params = {
            page,
            rows_per_page: rowsPerPage,
        };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        const response = await offerApi.get(
            OFFER_ENDPOINTS.GET_EXPORTATION_OFFERS,
            { params }
        );

        const { success, data, pagination, message } = response.data;

        if (success) {
            return { offers: data, pagination };
        } else {
            return message;
        }
    } catch (error) {
        console.error("Error fetching unexported offers:", error);
        throw error;
    }
}

export async function fetchFutureExportationOffers(page = 1, rowsPerPage = 10) {
    try {
        const response = await offerApi.get(
            OFFER_ENDPOINTS.GET_FUTURE_EXPORTATION_OFFERS,
            {
                params: {
                    page,
                    rows_per_page: rowsPerPage,
                },
            }
        );

        const { success, data, message } = response.data;

        if (success) {
            return { offers: data.offers, pagination: data.pagination };
        } else {
            return message;
        }
    } catch (error) {
        console.error("Error fetching unexported offers:", error);
        throw error;
    }
}

export async function getExportsHistory(
    page = 1,
    rowsPerPage = 10,
    filters = null
) {
    try {
        console.log("\n##########page ######\n", page, "\n################\n");
        const params = {
            page,
            rows_per_page: rowsPerPage,
        };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        const response = await offerApi.get(
            OFFER_ENDPOINTS.GET_EXPORTS_HISTORY,
            { params }
        );

        const { success, data, pagination, message } = response.data;

        if (success) {
            return { data, pagination };
        } else {
            return message;
        }
    } catch (err) {
        throw err;
    }
}

export async function getExportedOfferFile(id) {
    try {
        // Use axios with responseType blob for file download
        const response = await offerApi.get(
            `${OFFER_ENDPOINTS.GET_EXPORTED_OFFER_FILE.replace(":id", id)}`,
            { responseType: "blob" }
        );

        // Get the filename from Content-Disposition header
        const contentDisposition = response.headers["content-disposition"];
        let filename = "export.csv";
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        // Create a blob URL and trigger download
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return { success: true, message: "File downloaded successfully" };
    } catch (err) {
        console.error("Error downloading file:", err);
        throw err;
    }
}

export async function exportOffer(record) {
    try {
        // Use axios with responseType blob for file download
        const response = await offerApi.post(
            OFFER_ENDPOINTS.EXPORT_OFFERS,
            record,
            { responseType: "blob" } // Important for file download
        );

        console.log("response: ", response);

        // Check the type of data inside the response
        if (response.data.type === "application/json") {
            const txt = await response.data.text();
            const res = JSON.parse(txt);
            console.log(res);
            return { success: false, message: res.message };
        }

        // Get filename from content-disposition header or use default
        const contentDisposition = response.headers["content-disposition"];
        let filename = "export.csv";
        console.log(contentDisposition);
        if (contentDisposition) {
            // Try to match filename with quotes first: filename="file.csv"
            let filenameMatch = contentDisposition.match(
                /filename[^;=\n]*=["']?([^"';\n]*)["']?/i
            );
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        // Create a download link and trigger it
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Return success info
        return { success: true, filename };
    } catch (err) {
        console.error("Error exporting offers:", err);
        if (err.response && err.response.data) {
            // Try to parse error message if available
            try {
                const errorBlob = err.response.data;
                const textData = await new Response(errorBlob).text();
                const errorData = JSON.parse(textData);
                return errorData.message || "Export failed";
            } catch (parseError) {
                return "Export failed: " + err.message;
            }
        }
        return "Export failed: " + err.message;
    }
}

export async function sendOfferLetter(data) {
    try {
        const response = await offerApi.post("/api/offers/letter", data);

        const { success, message: msg } = response.data;

        if (success) {
            return { success: true };
        }

        return msg || "Failed to send offer letter";
    } catch (error) {
        console.error("Error sending offer letter:", error);
        throw error;
    }
}

export async function getOffer(id) {
    try {
        const response = await offerApi.get(
            `${OFFER_ENDPOINTS.GET_OFFER.replace(":id", id)}`
        );

        const { success, message, data } = response.data;

        if (success) {
            return data;
        }
        return message;
    } catch (err) {
        throw err;
    }
}

/**
 * Upload a file for offer import
 * @param {FormData} formData - FormData object containing the file to upload
 * @returns {Promise<Object>} - Import result
 */
export async function uploadOfferFile(formData) {
    try {
        const response = await offerApi.post(
            OFFER_ENDPOINTS.IMPORT_OFFER,
            formData,
            {
                headers: {
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
        console.error("Error uploading offer file:", error);
        throw error;
    }
}

export async function deleteOffer(id) {
    try {
        const response = await offerApi.delete(
            OFFER_ENDPOINTS.DELETE_OFFER.replace(":id", id)
        );

        const { success, message } = response.data;

        if (success) {
            return success;
        } else {
            return message;
        }
    } catch (err) {
        throw err;
    }
}

export async function updateOffer(id, payload) {
    try {
        const response = await offerApi.patch(
            OFFER_ENDPOINTS.UPDATE_OFFER.replace(":id", id),
            payload
        );

        const { success, message, data } = response.data;

        if (success) {
            return data;
        } else {
            return message;
        }
    } catch (err) {
        throw err;
    }
}

export async function updateChain(id, payload) {
    try {
        const response = await offerApi.patch(
            OFFER_ENDPOINTS.UPDATE_CHAIN.replace(":id", id),
            payload
        );

        const { success, message, data } = response.data;

        if (success) {
            return data;
        } else {
            return message;
        }
    } catch (err) {
        throw err;
    }
}

export async function deleteChain(id) {
    try {
        const response = await offerApi.delete(
            OFFER_ENDPOINTS.DELETE_CHAIN.replace(":id", id)
        );

        const { success, message } = response.data;

        if (success) {
            return success;
        } else {
            return message;
        }
    } catch (err) {
        throw err;
    }
}

export async function getChainsOffers(chainId) {
    try {
        const response = await offerApi.get(
            OFFER_ENDPOINTS.GET_CHAIN_OFFERS.replace(":id", chainId)
        );

        const { success, message, data } = response.data;

        if (success) {
            return data;
        } else {
            return message;
        }
    } catch (err) {
        throw err;
    }
}

export async function getClientServicesOffers(country, porter) {
    try {
        const response = await offerApi.get(
            OFFER_ENDPOINTS.GET_CLIENT_SERVICES,
            {
                params: {
                    country,
                    ...(porter ? { porter } : {}),
                },
            }
        );

        const { success, message, data } = response.data;

        if (success) {
            return data;
        } else {
            return message;
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Get enrolled clients with pagination and filters
 * @param {Object} params - Parameters object
 * @param {number} params.page - Page number (starts from 1)
 * @param {number} params.rows_per_page - Number of items per page (can also use limit)
 * @param {number} params.campaign_id - Campaign ID filter (optional)
 * @param {number} params.chain_id - Chain ID filter (optional)
 * @param {string} params.filters - JSON stringified filters (optional)
 * @returns {Promise<Object>} - Promise with enrolled clients data and pagination info
 */
export async function getMailFiles({
    page = 1,
    limit,
    rows_per_page,
    campaign_id, // Left it underscored because this is request param
    chain_id,
    filters,
} = {}) {
    try {
        const requestParams = {
            page,
            rows_per_page: rows_per_page || limit || 10,
        };

        // Add filters if provided
        if (campaign_id) {
            requestParams.campaign_id = campaign_id;
        }
        if (chain_id) {
            requestParams.chain_id = chain_id;
        }
        if (filters) {
            requestParams.filters = filters;
        }

        const response = await offerApi.get(OFFER_ENDPOINTS.GET_MAIL_FILES, {
            params: requestParams,
        });

        const { success, message = "", data, pagination } = response.data;

        if (success)
            return {
                data,
                pagination,
            };

        return message;
    } catch (error) {
        throw error;
    }
}

/**
 * Search for client offer by the code
 * @param {string} searchValue - Value to search for (data entry code)
 * @param {number} page - Page number (starts from 1)
 * @param {number} rows_per_page - Number of items per page
 * @returns {Promise<Object>} - Promise with search result
 */
export async function searchForClientOffer(
    searchValue,
    page = 1,
    rows_per_page = 10
) {
    try {
        if (!searchValue) {
            throw new Error("Search value is required");
        }

        const params = new URLSearchParams();
        params.append("page", page);
        params.append("rows_per_page", rows_per_page);
        params.append("code", searchValue);

        const response = await offerApi.get(
            `${OFFER_ENDPOINTS.SEARCH}?${params.toString()}`
        );

        const { success, message = "", data, pagination } = response.data;

        if (success) return { data, pagination };

        return message;
    } catch (error) {
        console.error(`Error searching client offer: `, error);
        throw error;
    }
}

export async function searchByClientChainOffer(clientId, offerId) {
    try {
        const response = await offerApi.get(`${OFFER_ENDPOINTS.SEARCH}`, {
            params: {
                client: clientId,
                offer: offerId,
            },
        });

        const { success, message = "", data } = response.data;

        if (success) return data;

        return message;
    } catch (error) {
        console.error(
            `Error searching client offer by client, chain and offer:`,
            error
        );
        throw error;
    }
}
