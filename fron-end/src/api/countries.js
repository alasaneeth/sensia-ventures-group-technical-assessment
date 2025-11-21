import { createAxiosInstance } from "./axiosSettings";

// API endpoints for countries
const COUNTRIES_ENDPOINTS = {
    ADD_COUNTRY: "/api/countries",
    GET_COUNTRIES: "/api/countries",
    UPDATE_COUNTRY: "/api/countries/:id",
    DELETE_COUNTRY: "/api/countries/:id",
};

// Create axios instance with base configuration
const countriesApi = createAxiosInstance();

export async function getCountries(
    page = 1,
    rows_per_page = 10,
    filters = null
) {
    try {
        const params = { page, rows_per_page };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        const response = await countriesApi.get(
            COUNTRIES_ENDPOINTS.GET_COUNTRIES,
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

export async function createCountry(countryData) {
    try {
        const response = await countriesApi.post(
            COUNTRIES_ENDPOINTS.ADD_COUNTRY,
            countryData
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

export async function updateCountry(id, countryData) {
    try {
        const response = await countriesApi.patch(
            COUNTRIES_ENDPOINTS.UPDATE_COUNTRY.replace(":id", id),
            countryData
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

export async function deleteCountry(id) {
    try {
        const response = await countriesApi.delete(
            COUNTRIES_ENDPOINTS.DELETE_COUNTRY.replace(":id", id)
        );

        const { success, message } = response.data;

        if (success) {
            return true;
        }

        console.error(message);

        return message;
    } catch (err) {
        throw err;
    }
}

