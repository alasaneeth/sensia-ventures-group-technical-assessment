import { theme } from "antd";
import { createAxiosInstance } from "./axiosSettings";

// API endpoints for orders
const COMMENTS_ENDPOINTS = {
    ADD_COMMENT: "/api/dev-comments",
    GET_COMMENT: "/api/dev-comments",
    UPDATE_COMMENT: "/api/dev-comments/:id",
};

// Create axios instance with base configuration
const commentsApi = createAxiosInstance();

export async function getComments(page = 0, rows_per_page = 10, userId = null) {
    try {
        const response = await commentsApi.get(COMMENTS_ENDPOINTS.GET_COMMENT, {
            params: {
                page,
                rows_per_page,
                userId,
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

export async function createComment(commentData) {
    try {
        const response = await commentsApi.post(
            COMMENTS_ENDPOINTS.ADD_COMMENT,
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

export async function updateComment(id, data) {
    try {
        const res = await commentsApi.patch(
            COMMENTS_ENDPOINTS.UPDATE_COMMENT.replace(":id", id),
            { data }
        );

        const { success, data: resultData, message } = res.data;

        if (success) {
            return resultData ;
        }

        console.error(message);

        return message;
    } catch (err) {
        throw err;
    }
}
