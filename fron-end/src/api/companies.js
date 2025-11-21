import { createAxiosInstance } from "./axiosSettings";

// API endpoints for companies
const COMPANIES_ENDPOINTS = {
    ADD_COMPANY: "/api/companies",
    GET_COMPANIES: "/api/companies",
    GET_COMPANY: "/api/companies/:id",
    DELETE_COMPANY: "/api/companies/:id",
    UPDATE_COMPANY: "/api/companies/:id",
};

// Create axios instance with base configuration
const companiesApi = createAxiosInstance();

export async function getCompanies(
    page = 1,
    rows_per_page = 10,
    filters = null
) {
    const params = { page, rows_per_page };

    // Add filters to params if provided
    if (filters) {
        params.filters = filters;
    }

    const response = await companiesApi.get(
        COMPANIES_ENDPOINTS.GET_COMPANIES,
        { params }
    );

    const { success, pagination, data, message } = response.data;

    if (success) {
        return { pagination, data };
    }

    console.error(message);

    return message;
}

export async function getCompany(id) {
    const response = await companiesApi.get(
        COMPANIES_ENDPOINTS.GET_COMPANY.replace(":id", id)
    );

    const { success, data, message } = response.data;

    if (success) {
        return data;
    }

    console.error(message);

    return message;
}

export async function createCompany(companyData) {
    const response = await companiesApi.post(
        COMPANIES_ENDPOINTS.ADD_COMPANY,
        companyData
    );

    const { success, data, message } = response.data;

    if (success) {
        return { data };
    }

    console.error(message);

    return message;
}

export async function updateCompany(id, payload) {
    const request = await companiesApi.patch(
        COMPANIES_ENDPOINTS.UPDATE_COMPANY.replace(":id", id),
        { payload }
    );

    const { success, data, message } = request.data;

    if (success) {
        return data;
    }

    console.error(message);

    return message;
}

export async function deleteCompany(id) {
    const request = await companiesApi.delete(
        COMPANIES_ENDPOINTS.DELETE_COMPANY.replace(":id", id)
    );

    const { success, message } = request.data;

    if (success) return success;

    return message;
}

