import DevComment from "../models/devComment.js";
import User from "../../auth/models/user.js";
import APIError from "../../../utils/APIError.js";
import { filtersParser } from "../../../utils/filterParsers.js";

class DevCommentServices {
    /**
     * Get all comments with pagination
     * @param {number} offset - Offset for pagination
     * @param {number} limit - Limit for pagination
     * @param {Object} filters - Filters for the query
     * @returns {Promise<Object>} - Comments with pagination info
     */
    async getAllComments(offset = 0, limit = 10, userId = null) {
        try {
            let whereClause = {};
            if (userId) {
                whereClause = {
                    userId,
                };
            }

            const { rows: comments, count: totalCount } =
                await DevComment.findAndCountAll({
                    where: whereClause,
                    limit,
                    offset,
                    order: [["createdAt", "DESC"]],
                    include: [
                        {
                            model: User,
                            as: "user",
                        },
                    ],
                });

            // Calculate pagination info
            const pages = Math.ceil(totalCount / limit);
            const currentPage = Math.floor(offset / limit) + 1;

            return {
                data: comments,
                pagination: {
                    total: totalCount,
                    page: currentPage,
                    pages,
                    limit,
                },
            };
        } catch (error) {
            console.error("Error getting comments:", error);
            throw error;
        }
    }

    /**
     * Create a new comment
     * @param {Object} commentData - Comment data
     * @param {number} commentData.userId - User ID
     * @param {string} commentData.type - Comment type (bug, feature)
     * @param {string} commentData.comment - Comment text
     * @returns {Promise<Object>} - Created comment
     */
    async createComment(commentData) {
        try {
            const comment = await DevComment.create({
                userId: commentData.userId,
                type: commentData.type,
                comment: commentData.comment,
            });

            // Fetch the comment with user data
            const commentWithUser = await DevComment.findByPk(comment.id, {
                include: [
                    {
                        model: User,
                        as: "user",
                    },
                ],
            });

            return commentWithUser;
        } catch (error) {
            console.error("Error creating comment:", error);
            throw error;
        }
    }

    /**
     * Update an existing comment
     * @param {number} id - Comment ID
     * @param {Object} commentData - Comment data
     * @param {number} userId - User ID making the update
     * @returns {Promise<Object>} - Updated comment
     */
    async updateComment(id, commentData, userId) {
        try {
            const comment = await DevComment.findByPk(id);

            if (!comment) {
                throw new APIError(
                    "Comment not found",
                    404,
                    "COMMENT_NOT_FOUND"
                );
            }

            // Only allow the comment creator to update it
            if (comment.userId !== String(userId)) {
                throw new APIError(
                    "Not authorized to update this comment",
                    403,
                    "NOT_AUTHORIZED"
                );
            }

            // Update comment
            await comment.update(commentData, {
                where: {
                    id,
                },
            });

            // Fetch the updated comment with user data
            const updatedComment = await DevComment.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                    },
                ],
            });

            return updatedComment;
        } catch (error) {
            console.error("Error updating comment:", error);
            throw error;
        }
    }
}

export default new DevCommentServices();