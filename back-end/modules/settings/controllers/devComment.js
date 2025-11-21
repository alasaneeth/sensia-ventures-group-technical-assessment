import APIError from "../../../utils/APIError.js";
import DevCommentServices from "../services/devComment.js";

class DevCommentControllers {
    /**
     * Get all comments with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getComments(req, res, next) {
        try {
            const userId = req?.user?.id;
            const { offset, limit } = req?.pagination;

            const result = await DevCommentServices.getAllComments(
                offset,
                limit,
                userId
            );

            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Add a new comment
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addComment(req, res, next) {
        try {
            const { type, comment } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return next(
                    new APIError(
                        "User not authenticated",
                        401,
                        "NOT_AUTHENTICATED"
                    )
                );
            }

            if (!comment) {
                return next(
                    new APIError(
                        "Comment text is required",
                        400,
                        "MISSING_COMMENT"
                    )
                );
            }

            if (!type || !["bug", "feature"].includes(type)) {
                return next(
                    new APIError(
                        "Valid type is required (bug or feature)",
                        400,
                        "INVALID_TYPE"
                    )
                );
            }

            const createdComment = await DevCommentServices.createComment({
                userId,
                type,
                comment,
            });

            res.status(201).json({
                success: true,
                data: createdComment,
                message: "Comment created successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update an existing comment
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateComment(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body?.data;
            const userId = req.user?.id;

            if (data.userId) {
                delete data.userId;
            }

            if (!userId) {
                return next(
                    new APIError(
                        "User not authenticated",
                        401,
                        "NOT_AUTHENTICATED"
                    )
                );
            }

            if (!id) {
                return next(
                    new APIError("Comment ID is required", 400, "MISSING_ID")
                );
            }

            if (!data) {
                return next(
                    new APIError("Nothing to update", 400, "NOTHING_TO_UPDATE")
                );
            }

            const updatedComment = await DevCommentServices.updateComment(
                id,
                data,
                userId
            );

            res.status(200).json({
                success: true,
                data: updatedComment,
                message: "Comment updated successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new DevCommentControllers();
