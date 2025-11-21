import APIError from "../../../utils/APIError.js";
import orderServices from "../services/order.js";

class OrderControllers {
    /**
     * Get orders with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getOrders(req, res, next) {
        try {
            // Get the rows_per_page, page, and country from the search params
            const page = parseInt(req.query.page) || 1;
            const rowsPerPage = parseInt(req.query.rows_per_page) || 10;
            const filters = req.query?.filters;

            // Validate pagination parameters
            if (page < 1 || rowsPerPage < 1) {
                throw new APIError(
                    "Invalid pagination parameters",
                    400,
                    "INVALID_PAGINATION"
                );
            }

            // Calculate offset and limit for database query
            const offset = (page - 1) * rowsPerPage;
            const limit = rowsPerPage;

            const maxLimit = Math.min(limit, 200);

            // Send them to the order service with filters if provided
            const result = await orderServices.getOrders(
                offset,
                maxLimit,
                filters
            );

            // Return success response
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
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getSummary(req, res, next) {
        try {
            const { offset, limit } = req?.pagination;
            const filters = req?.query?.filters;
            const result = await orderServices.getOrdersSummary(
                offset,
                limit,
                filters
            );

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Place an order controller
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async placeOrder(req, res, next) {
        try {
            const {
                amount,
                discountAmount,
                checkAmount,
                cashAmount,
                postalAmount,
                payee,
                skus,
                currency,
                clientOfferId,
            } = req.body;

            // Validate required fields.
            // If we have a client offer id and code, we don't need client_id, chain_id, offer_id
            if (clientOfferId === null) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: clientOfferId",
                });
            }

            // Validate cash amount
            if (typeof amount !== "number" || amount < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be a positive number",
                });
            }

            // Place the order
            const { order, message } = await orderServices.placeOrder({
                amount,
                discountAmount,
                checkAmount,
                cashAmount,
                postalAmount,
                payee,
                skus,
                currency,
                clientOfferId,
            });

            res.status(201).json({
                success: true,
                message: "Order placed successfully",
                ...(message !== null ? { warning: message } : {}),
                data: order,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * This controller when you don't exported the client
     * to a campaign. and you want to place an order for
     * that user
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async placeOrderNotSelected(req, res, next) {
        try {
            const {
                amount,
                discountAmount,
                cashAmount,
                checkAmount,
                postalAmount,
                payee,
                skus,
                currency,
                totalAmount,
                clientId,
                chainId = null, // default set it to null
                offerId,
                campaignId,
            } = req.body;

            if (!offerId) {
                return next(
                    new APIError(
                        "Missing required fields (offerId)",
                        400,
                        "MISSING_REQUIRED_FIELDS"
                    )
                );
            }

            const result = await orderServices.placeOrderNotSelected({
                amount,
                discountAmount,
                cashAmount,
                checkAmount,
                postalAmount,
                payee,
                skus,
                currency,
                totalAmount,
                clientId,
                chainId,
                offerId,
                campaignId,
            });

            res.status(201).json({
                success: true,
                data: result.order,
                message: result.message,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async deleteOrder(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                throw new APIError(
                    "The order id is required",
                    400,
                    "MISSING_ID"
                );
            }

            const result = await orderServices.deleteOrder(id);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * // This will allow only update the amount and payment methods if some mistakes happened
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateOrder(req, res, next) {
        try {
            const { id } = req.params;
            const { data } = req?.body;

            if (!id)
                return next(
                    new APIError(
                        "The order id is required",
                        400,
                        "MISSING_DATA"
                    )
                );

            const newOrder = await orderServices.updateOrder(id, data);

            return res.status(200).json({
                success: true,
                data: newOrder,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new OrderControllers();
