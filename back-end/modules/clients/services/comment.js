import APIError from "../../../utils/APIError.js";
import Client from "../models/client.js";
import Comment from "../models/comments.js";
class CommentServices {
    async createComment(clientId, comment) {
        try {
            const client = await Client.findByPk(clientId);
            if (!client) throw new APIError("Client not found", 404);

            const newComment = await Comment.create({
                clientId,
                comment,
            });

            return newComment;
        } catch (err) {
            throw err;
        }
    }

    async getComments(clientId, offset, limit) {
        try {
            const client = await Client.findByPk(clientId);

            if (!client) throw new APIError("Client not found", 404);

            const { rows: comments, count: totalCount } =
                await Comment.findAndCountAll({
                    where: {
                        clientId,
                    },
                    // For now as this will not be too much comments for the same client
                    // offset,
                    // limit,
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            // Return clients with pagination info
            return {
                data: comments,
                pagination: {
                    total: totalCount,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }
}

export default new CommentServices();
