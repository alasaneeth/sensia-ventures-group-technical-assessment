import { createAxiosInstance } from "./axiosSettings";

// API endpoints for brands
const BRANDS_ENDPOINTS = {
    ADD_BRAND: "/api/companies/:companyId/brands",
    GET_BRANDS: "/api/companies/:companyId/brands",
    GET_BRAND: "/api/companies/brands/:id",
    DELETE_BRAND: "/api/companies/brands/:id",
    UPDATE_BRAND: "/api/companies/brands/:id",
};

// Create axios instance with base configuration
const brandsApi = createAxiosInstance();

export async function getBrands(
    companyId,
    page = 1,
    rows_per_page = 10,
    filters = null
) {
    const params = { page, rows_per_page };

    // Add filters to params if provided
    if (filters) {
        params.filters = filters;
    }

    const response = await brandsApi.get(
        BRANDS_ENDPOINTS.GET_BRANDS.replace(":companyId", companyId),
        { params }
    );

    const { success, pagination, data, message } = response.data;

    if (success) {
        return { pagination, data };
    }

    console.error(message);

    return message;
}

export async function getBrand(id) {
    const response = await brandsApi.get(
        BRANDS_ENDPOINTS.GET_BRAND.replace(":id", id)
    );

    const { success, data, message } = response.data;

    if (success) {
        return data;
    }

    console.error(message);

    return message;
}

export async function createBrand(companyId, brandData) {
    const response = await brandsApi.post(
        BRANDS_ENDPOINTS.ADD_BRAND.replace(":companyId", companyId),
        brandData
    );

    const { success, data, message } = response.data;

    if (success) {
        return { data };
    }

    console.error(message);

    return message;
}

export async function updateBrand(id, payload) {
    const request = await brandsApi.patch(
        BRANDS_ENDPOINTS.UPDATE_BRAND.replace(":id", id),
        { payload }
    );

    const { success, data, message } = request.data;

    if (success) {
        return data;
    }

    console.error(message);

    return message;
}

export async function deleteBrand(id) {
    const request = await brandsApi.delete(
        BRANDS_ENDPOINTS.DELETE_BRAND.replace(":id", id)
    );

    const { success, message } = request.data;

    if (success) return success;

    return message;
}

export async function getBrandsFor(companyIds) {
    const response = await brandsApi.post("/api/companies/brands", {
        companies: companyIds,
    });

    const { success, data, message } = response.data;

    if (success) {
        return data;
    }

    console.error(message);

    return message;
}

