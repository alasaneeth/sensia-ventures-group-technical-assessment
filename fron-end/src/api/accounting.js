import { createAxiosInstance } from "./axiosSettings";

// API endpoints for orders
const ACCOUNTING_ENDPOINTS = {
    ADD_INVOICE: "/api/accounting/invoices",
    GET_INVOICES: "/api/accounting/invoices",
    GET_PAYMENTS: "/api/accounting/payments",
    ADD_PAYMENT: "/api/accounting/payments",
    GET_SUMMARY: "/api/accounting/summary",
    EDIT_PAYMENT: "/api/accounting/payments/:id",
    EDIT_INVOICE: "/api/accounting/invoices/:id",
};

// Create axios instance with base configuration
const accountingApi = createAxiosInstance();

export async function getInvoices(
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

        const response = await accountingApi.get(
            ACCOUNTING_ENDPOINTS.GET_INVOICES,
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

export async function createInvoice(invoiceData) {
    try {
        const response = await accountingApi.post(
            ACCOUNTING_ENDPOINTS.ADD_INVOICE,
            invoiceData
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

export async function getSummary(page = 0, rows_per_page = 10, filters = null) {
    try {
        const params = { page, rows_per_page };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters;
        }

        const response = await accountingApi.get(
            ACCOUNTING_ENDPOINTS.GET_SUMMARY,
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

export async function getPayments(
    page = 0,
    rows_per_page = 10,
    filters = null
) {
    try {
        const params = { page, rows_per_page };

        // Add filters to params if provided
        if (filters) {
            params.filters = filters
        }

        const response = await accountingApi.get(
            ACCOUNTING_ENDPOINTS.GET_PAYMENTS,
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

export async function createPayment(paymentData) {
    try {
        const response = await accountingApi.post(
            ACCOUNTING_ENDPOINTS.ADD_PAYMENT,
            paymentData
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

export async function updatePayment(id, paymentData) {
    try {
        const response = await accountingApi.patch(
            ACCOUNTING_ENDPOINTS.EDIT_PAYMENT.replace(":id", id),
            { data: paymentData }
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
export async function updateInvoice(id, invoiceData) {
    try {
        const response = await accountingApi.patch(
            ACCOUNTING_ENDPOINTS.EDIT_INVOICE.replace(":id", id),
            { data: invoiceData }
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
