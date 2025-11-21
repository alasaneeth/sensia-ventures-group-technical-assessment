import keyCodeServices from "../services/keyCode.js";
import APIError from "../../../utils/APIError.js";
import { Sequelize } from "sequelize";
import KeyCode from "../models/keyCode.js";
import KeyCodeDetails from "../models/keyCodeDetails.js";
import isNumber from "../../../utils/isNumber.js";

// Here the controllers that are responsible of getting the key codes
class KeyCodeControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getCampaignKeyCodes(req, res, next) {
        try {
            // Get the campaign id from the request params
            const { id } = req?.params;

            const segements = await keyCodeServices.getCampaignKeyCodes(id);

            res.status(200).json({
                success: true,
                data: segements,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get key codes for a campaign, only count the clients on it
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getCampaignKeyCodesCount(req, res, next) {
        try {
            const { campaignId } = req.params;

            if (!campaignId) {
                throw new APIError(
                    "Campaign ID is required",
                    400,
                    "MISSING_CAMPAIGN_ID"
                );
            }

            const keyCodes = await keyCodeServices.getCampaignKeyCodeCount(
                campaignId
            );

            res.status(200).json({
                success: true,
                message: "Key codes retrieved successfully",
                data: keyCodes,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Controller to extract to create a key code in a campaign and add the clients to it, due to extraction rules (filters)
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     * @param {import('express').NextFunction} next - Express next function
     */
    async createKey(req, res, next) {
        try {
            // Extract keyCode and keyCodeDescription from request body
            const { filters, keyCodeDescription, offerId, listName } = req.body;

            const { campaignId } = req?.params;

            // Validate campaignId is provided
            if (!campaignId) {
                return next(
                    new APIError(
                        "Campaign ID is required",
                        400,
                        "MISSING_REQUIRED_DATA"
                    )
                );
            }

            // Validate campaignId is a number
            if (!isNumber(campaignId)) {
                return next(
                    new APIError(
                        "Campaign ID must be a number",
                        400,
                        "INVALID_DATA_TYPE"
                    )
                );
            }

            if (!filters) {
                return next(
                    new APIError(
                        "Filters object is required",
                        400,
                        "MISSING_REQUIRED_DATA"
                    )
                );
            }

            // Filter-based enrollment
            let result = await keyCodeServices.createKeyCode(
                campaignId,
                offerId,
                filters,
                keyCodeDescription,
                listName
            );

            // Return success response without data
            return res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (err) {
            console.error("Error in encrollClients controller:", err);
            next(err);
        }
    }

    /**
     * Controller to extract segmented clients to campaign
     * Creates client_offers and offer_prints for all non-extracted key_codes
     * @param {import('express').Request} req - Express request object with campaignId in body
     * @param {import('express').Response} res - Express response object
     * @param {import('express').NextFunction} next - Express next function
     */
    async extractCampaign(req, res, next) {
        try {
            const { campaignId } = req.params;

            // Validate campaignId is provided
            if (!campaignId) {
                return next(
                    new APIError(
                        "Campaign ID is required",
                        400,
                        "MISSING_REQUIRED_DATA"
                    )
                );
            }

            // Validate campaignId is a number
            if (!/^\d+$/.test(campaignId)) {
                return next(
                    new APIError(
                        "Campaign ID must be a number",
                        400,
                        "INVALID_DATA_TYPE"
                    )
                );
            }

            // Process the extraction
            const result = await keyCodeServices.extractSegmentedClients(
                campaignId
            );

            // Return success response
            return res.status(200).json({
                success: true,
                message: result.message,
                count: result.count,
            });
        } catch (err) {
            console.error("Error in extractClients controller:", err);
            next(err);
        }
    }
}

export default new KeyCodeControllers();
