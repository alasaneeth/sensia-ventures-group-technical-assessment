import campaignServices from "../services/campaign.js";
import APIError from "../../../utils/APIError.js";
// Anything related to campaign directly will be seen here. For key codes look for the next file
class CampaignControllers {
    /**
     * Add a new campaign
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addCampaign(req, res, next) {
        try {
            // Take the data from the body
            const {
                code,
                country,
                description,
                mailDate,
                chainId,
                companyId, // Accepted from frontend but not stored in DB
                brandId,
                offers, // This must be an array [{offerId, returnAddressId, printer, payeeNameId, fixedPrice}]
            } = req.body;

            // Validate required fields
            if (!code) {
                throw new APIError(
                    "Campaign code is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            if (!country) {
                throw new APIError(
                    "Campaign country is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            if (!brandId) {
                throw new APIError(
                    "Brand is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            // Send the data to campaign service (companyId is not included - only brandId is stored)
            const campaign = await campaignServices.createCampaign({
                code,
                country: country.toLowerCase(),
                description,
                mailDate,
                chainId,
                brandId,
                offers,
            });

            // Return the response to the client
            res.status(201).json({
                success: true,
                data: campaign,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get campaigns with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getCampaigns(req, res, next) {
        try {
            // Get the rows_per_page, page, and filter from the search params
            const { offset, limit } = req?.pagination;
            const include = Number.isNaN(parseInt(req?.query?.include))
                ? 1
                : parseInt(req?.query?.include);

            // Extract sorting parameters
            const sortField = req.query.sortField;
            const sortDirection = req.query.sortDirection || "ASC";

            // Filter means get the campaigns that doesn't has exported clients to it yet
            // const filter = req.query.filtere === "true";
            const filters = req?.query?.filters;

            const result = await campaignServices.getCampaigns(
                offset,
                limit,
                filters,
                include,
                sortField,
                sortDirection
            );

            // Return the response to the client
            res.status(200).json({
                success: true,
                data: result.campaigns,
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
    async deleteCampaign(req, res, next) {
        try {
            const { id } = req?.params;

            await campaignServices.deleteCampaign(id);

            return res.status(200).json({
                success: true,
                message: "Campaign deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get campaign details by ID with chain data
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getCampaignById(req, res, next) {
        try {
            // Get campaign ID from URL params
            const { id } = req.params;

            if (!id) {
                return next(
                    new APIError(
                        "Campaign ID is required",
                        400,
                        "MISSING_CAMPAIGN_ID"
                    )
                );
            }
            // Get campaign details with chain data
            const result = await campaignServices.getCampaignById(
                id,
                false,
                true
            );

            // Return success response
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update campaign and its associated offers
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateCampaign(req, res, next) {
        try {
            const { id } = req?.params;
            const { values, offers } = req?.body || {};

            // Update the campaign and its offers using the service function
            await campaignServices.updateCampaign(values, id, offers);

            return res.status(200).json({
                success: true,
                message: "Campaign updated successfully",
            });
        } catch (err) {
            console.error("Error updating campaign:", err);
            next(err);
        }
    }

    /**
     * Get the newest campaign and chain for the selceted offer (from past 10 days from now)
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getLastCamChain(req, res, next) {
        try {
            const { offerId } = req?.params;

            const offer = await campaignServices.getLastCampChain(offerId);

            // If the offer is a string meaning it's not belong to any campaign or chain
            if (typeof offer === "string")
                return res.status(200).json({
                    success: true,
                    message: offer,
                });

            // This contains the campaign and the chain
            return res.status(200).json({
                success: true,
                data: offer,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get payee name for a specific campaign and offer
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getPayeeName(req, res, next) {
        try {
            const { offerId, campaignId } = req?.params;

            // Validate required parameters
            if (!campaignId) {
                throw new APIError(
                    "Campaign ID is required",
                    400,
                    "MISSING_CAMPAIGN_ID"
                );
            }

            if (!offerId) {
                throw new APIError(
                    "Offer ID is required",
                    400,
                    "MISSING_OFFER_ID"
                );
            }

            // Get payee name from service
            const payeeName = await campaignServices.getPayeeNameForOffer(
                campaignId,
                offerId
            );

            // Return success response
            res.status(200).json({
                success: true,
                data: payeeName,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new CampaignControllers();
