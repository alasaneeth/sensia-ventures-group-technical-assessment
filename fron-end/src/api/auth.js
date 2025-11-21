import { createAxiosInstance } from "./axiosSettings";

// API endpoints for authentication
const AUTH_ENDPOINTS = {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    GET_SESSION: "/api/auth/get-session",
};

// Create axios instance with base configuration
const authApi = createAxiosInstance();

/**
 * Login user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise} - Response with user data and access token
 */
export async function login(username, password) {
    try {
        const response = await authApi.post(AUTH_ENDPOINTS.LOGIN, {
            username,
            password,
        });
        const {
            success,
            message,
            data,
        } = response.data;

        if (!success) {
            return message;
        }

        const {user, accessToken} = data;

        return { user, accessToken };
    } catch (error) {
        throw error;
    }
}

/**
 * Get current user session
 * @param {string} token - Access token
 * @returns {Promise} - Response with user data
 */
export async function getSession(token) {
    try {
        const response = await authApi.get(AUTH_ENDPOINTS.GET_SESSION, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const { success, message, data } = response.data;

        if (!success) return message;


        return { user: data, token };
    } catch (error) {
        throw error
    }
}

/**
 * Logout user
 * @returns {Promise} - Response with success message
 */
export async function logout() {
    try {
        const response = await authApi.get(AUTH_ENDPOINTS.LOGOUT);
        return response.data.success;
    } catch (error) {
        throw error;
    }
}
