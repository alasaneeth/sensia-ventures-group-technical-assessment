import { createAxiosInstance } from "./axiosSettings";

// API endpoints for orders
const COMMENTS_ENDPOINTS = {
    ADD_COMMENT: "api/comments/:id",
    GET_COMMENT: "api/comments/",
};

// Create axios instance with base configuration
const commentsApi = createAxiosInstance();

export async function getComments(clientId, page = 0, rows_per_page = 10) {
    try {
        const response = await commentsApi.get(COMMENTS_ENDPOINTS.GET_COMMENT, {
            params: {
                page,
                rows_per_page,
                clientId,
            },
        });

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

export async function createComment(clientId, commentData) {
    try {
        const response = await commentsApi.post(
            COMMENTS_ENDPOINTS.ADD_COMMENT.replace(":id", clientId),
            commentData
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
