import APIError from "../../../utils/APIError.js";
import offerServices from "../services/offer.js";

class OfferControllers {
    /**
     * Add a new offer
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addOffer(req, res, next) {
        try {
            // Take the offer data from the request body
            const {
                title,
                description,
                porter,
                owner,
                theme,
                grade,
                language,
                version,
                origin,
                returnAddressId,
                country,
                type,
                payeeNameId,
                companyId,
                brandId,
                skus,
            } = req.body;

            // Validate required fields
            if (!title) {
                throw new APIError(
                    "Offer title is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            if (!brandId) {
                throw new APIError("Brand is required", 400, "MISSING_BRAND");
            }

            // Pass data to service layer (companyId is accepted from frontend but not stored in DB)
            const offer = await offerServices.createOffer(
                {
                    title,
                    description,
                    porter,
                    owner,
                    theme,
                    grade,
                    language,
                    version,
                    origin,
                    returnAddressId,
                    country,
                    type,
                    payeeNameId,
                    brandId, // companyId is ignored - only brandId is stored
                },
                skus
            );

            // Return the response to the client
            res.status(201).json({
                success: true,
                message: "Offer created successfully",
                data: offer,
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
    async deleteOffer(req, res, next) {
        try {
            const { id } = req?.params;

            await offerServices.deleteOffer(id);

            return res.status(200).json({
                success: true,
                message: "Offer deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get offer by ID
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getOffer(req, res, next) {
        try {
            const offerId = req.params.id;

            if (!offerId) {
                throw new APIError(
                    "Offer ID is required",
                    400,
                    "MISSING_OFFER_ID"
                );
            }

            // Get offer from service
            const offer = await offerServices.getOffer(offerId);

            // Return success response
            res.status(200).json({
                success: true,
                data: offer,
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
    async getOffers(req, res, next) {
        try {
            const includeNotInChain =
                Number(req.query.include_not_in_chain) ?? 1;
            const filters = req.query;

            // Extract sorting parameters
            const sortField = req.query.sortField;
            const sortDirection = req.query.sortDirection || "ASC";

            const orFields = req?.query?.orFields || [];

            // Remove non-filter parameters
            delete filters.rows_per_page;
            delete filters.page;
            delete filters.include_not_in_chain;
            delete filters.orFields;
            delete filters.sortField;
            delete filters.sortDirection;

            const { offset, limit } = req?.pagination;

            // Send them to the offer service
            const result = await offerServices.getOffers(
                offset,
                limit,
                includeNotInChain,
                filters,
                orFields,
                sortField,
                sortDirection
            );

            // Return the response to the client
            res.status(200).json({
                success: true,
                message: "Offers retrieved successfully",
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
    async updateOffer(req, res, next) {
        try {
            const { payload } = req.body;
            const { id } = req.params;

            const updatedOffer = await offerServices.updateOffer(id, payload);

            return res.status(200).json({
                success: true,
                data: updatedOffer,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get enrolled clients with pagination ###
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getMailFiles(req, res, next) {
        try {
            // Extract campaign_id filter parameter
            let campaignId = null;
            const { offset, limit } = req?.pagination;

            // Parse and validate campaign_id if provided
            if (req.query.campaign_id) {
                campaignId = parseInt(req.query.campaign_id);
                if (isNaN(campaignId) || campaignId <= 0) {
                    throw new APIError(
                        "Invalid campaign_id parameter",
                        400,
                        "INVALID_FILTER_PARAM"
                    );
                }
            }

            // Extract filters parameter if provided and parse JSON string
            let filters = req.query.filters;

            // Send pagination and filter parameters to the client service
            const result = await offerServices.getMailFiles({
                offset,
                limit,
                campaignId,
                filters,
            });

            // Return success response
            res.status(200).json({
                success: true,
                message: "Enrolled clients retrieved successfully",
                data: result.data,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Search for client offer by code ###
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async searchForClientOffer(req, res, next) {
        try {
            // Get code from query parameters
            const { code, client, offer } = req.query;

            if (!(code || (client && offer))) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Offer code, or client id and the offer id. Are required",
                });
            }

            // Search for client offer by code

            let result = null;
            if (code) {
                result = await offerServices.searchClientOfferByCode(code);
            } else {
                result = {
                    data: await offerServices.searchClientOfferByOffer(
                        offer,
                        client
                    ),
                };
            }

            if (result === null || result?.length === 0) {
                return next(
                    new APIError(
                        "Client offer not found",
                        404,
                        "CLIENT_OFFER_NOT_FOUND"
                    )
                );
            }

            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result?.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Add/Send an offer letter to a client
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addOfferLetter(req, res, next) {
        try {
            const {
                offerLetterId,
                clientOfferId,
                clientId,
                offerId,
                chainId,
                campaignId,
            } = req.body;

            const success = await offerServices.addOfferLetter(
                offerLetterId,
                clientOfferId,
                clientId,
                offerId,
                chainId,
                campaignId
            );

            // TODO: Implement the logic to:
            // 1. Validate the offer letter exists
            // 2. If clientOfferId is provided, use that client offer
            // 3. If not, create a new entry or association with the client, offer, and chain
            // 4. Store the offer letter association
            // 5. Possibly create an OfferPrint entry for printing

            res.status(200).json({
                success: true,
                message: "Offer letter sent successfully (placeholder)",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new OfferControllers();
