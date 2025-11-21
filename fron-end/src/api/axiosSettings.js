import axios from "axios";

//
// save all instanecs
const axiosInstances = [];
/**
 * Create and export a configured axios instance with common settings
 */
export const createAxiosInstance = (customConfig = {}) => {
    const instance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: {
            "Content-Type": "application/json",
        },
        ...customConfig,
        validateStatus: function () {
            // Accept all status codes, don't throw
            return true;
        },
    });

    // Add request interceptor to attach token from localStorage on every request
    instance.interceptors.request.use(
        (config) => {
            // Get token from localStorage if not already set in headers
            if (!config.headers.Authorization) {
                const token = localStorage.getItem("token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Save the instance
    axiosInstances.push(instance);

    return instance;
};

/**
 * Set token for all future requests
 * @param {string} token - Access token
 */
export function setAuthToken(token) {
    console.log("setting the token: ", token);
    // For all axios instances
    if (token) {
        axiosInstances.forEach((instance) => {
            instance.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${token}`;
        });
    } else {
        axiosInstances.forEach((instance) => {
            delete instance.defaults.headers.common["Authorization"];
        });
    }
}

export default createAxiosInstance;
