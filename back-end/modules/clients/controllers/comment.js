import APIError from "../../../utils/APIError.js";
import commentServices from "../services/comment.js";

class CommentServices {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addComment(req, res, next) {
        try {
            const { clientId } = req?.params;

            const { comment } = req?.body;

            if (!comment)
                return next(new APIError("The comment can't be null", 400));

            const newComment = await commentServices.createComment(
                clientId,
                comment
            );

            return res.status(201).json({
                success: true,
                data: newComment,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getComments(req, res, next) {
        try {
            // Get the rows_per_page, page, and country from the search params
            const clientId = req.query.clientId || null;
            const { limit, offset } = req?.pagination;

            const comments = await commentServices.getComments(
                clientId,
                offset,
                limit
            );

            return res.status(200).json({
                success: true,
                data: comments.data,
                pagination: comments.pagination,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new CommentServices();
