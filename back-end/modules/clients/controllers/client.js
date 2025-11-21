import APIError from "../../../utils/APIError.js";
import { unlink } from "fs/promises";
import clientServices from "../services/client.js";


class ClientControllers {
    /**
     * Add a new client
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addClient(req, res, next) {
        try {
            // Extract client data from request body - all fields are optional now
            const {
                // Basic Information
                firstName,
                lastName,
                additionalName,
                title,
                email,
                phone,
                gender,

                // Address Information
                street,
                city,
                zipCode,
                country,
                countryCode,
                address1,
                address2,
                address3,

                // Customer Information
                groupCode,
                companyCode,
                customerCode,
                modulusCode,
                originCode,
                isBlacklisted,

                // Birth Information
                birthDate,
                
                // Company and Brand
                companyId, // Accepted from frontend but not stored in DB
                brandId,
            } = req.body;

            // Validate required fields
            if (!brandId) {
                return next(
                    new APIError("Brand is required", 400, "MISSING_BRAND")
                );
            }

            // Pass data to service layer (companyId is not included - only brandId is stored)
            const client = await clientServices.createClient({
                // Basic Information
                firstName,
                lastName,
                additionalName,
                title,
                email,
                phone,
                gender,

                // Address Information
                street,
                city,
                zipCode,
                country,
                countryCode,
                address1,
                address2,
                address3,

                // Customer Information
                groupCode,
                companyCode,
                customerCode,
                modulusCode,
                originCode,
                isBlacklisted,

                // Birth Information
                birthDate: birthDate,
                
                // Brand only (company is derived from brand)
                brandId,
            });

            // Return success response
            res.status(201).json({
                success: true,
                message: "Client created successfully",
                data: client,
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
    async getClient(req, res, next) {
        try {
            const { id } = req?.params;

            const client = await clientServices.getClientById(id);

            return res.status(200).json({
                success: true,
                data: client,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get clients with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getClients(req, res, next) {
        try {
            // Get the rows_per_page, page, and country from the search params
            const { offset, limit } = req?.pagination;
            const filters = req.query;

            const sort = [req.query.sortBy, req.query.dir];
            const or = req.query.or;

            // Delete page and rows_per_page from filters
            delete filters.page;
            delete filters.rows_per_page;
            delete filters.sortBy;
            delete filters.dir;
            delete filters.or;

            // Send them to the client service with country filter if provided
            const result = await clientServices.getClients(
                offset,
                limit,
                filters,
                sort,
                or
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
     * Get clients that are not enrolled in a specific campaign (not normal filters if where so then both endpoints will be the same)
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getNotExtractedClients(req, res, next) {
        try {
            // Get the rows_per_page, page, campaign_id, and country from the search params
            const { offset, limit } = req?.pagination;
            const campaignId = parseInt(req.query.campaign_id);
            const sort = [req.query?.sortBy, req.query?.dir];
            const offerId = req?.query?.offerId;
            const filters = req.query;

            // Update filters to remove pagination and campaign_id
            delete filters.page;
            delete filters.rows_per_page;
            delete filters.campaign_id;
            delete filters.sortBy;
            delete filters.dir;
            delete filters.offerId;

            // Validate campaign_id is provided
            if (!campaignId || isNaN(campaignId)) {
                throw new APIError(
                    "Campaign ID is required and must be a valid number",
                    400,
                    "INVALID_CAMPAIGN_ID"
                );
            }

            // Send them to the client service with campaign and country filters
            const result = await clientServices.getNotExtractedClients(
                offset,
                limit,
                campaignId,
                offerId,
                filters,
                sort
            );

            // Return success response
            res.status(200).json({
                success: true,
                message: "Filtered clients retrieved successfully",
                data: result.data,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Controller to get import history records
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     * @param {import('express').NextFunction} next - Express next function
     */
    async getImportHistory(req, res, next) {
        try {
            // Get all import history records, sorted by createdAt in descending order
            const { offset, limit } = req?.pagination;
            const filters = req.query.filter || {};

            const importHistory = await clientServices.getImportHistory(
                offset,
                limit,
                filters
            );

            return res.status(200).json({
                success: true,
                message: "Import history retrieved successfully",
                data: importHistory.data,
                pagination: importHistory.pagination,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Controller to handle file upload and database (clients data) import
     * @param {import('express').Request} req - Express request object with file attached by multer
     * @param {import('express').Response} res - Express response object
     * @param {import('express').NextFunction} next - Express next function
     */
    async importDatabase(req, res, next) {
        try {
            // Check if file exists in request
            if (!req.file) {
                return next(new APIError("No file uploaded", 400));
            }

            // Get company and brand IDs from request body
            const { companyId, brandId } = req.body;

            // Validate that brandId is provided
            if (!brandId || brandId === "null" || brandId === "undefined") {
                return next(new APIError("Brand ID is required", 400));
            }

            console.log('\n######## brand id ########\n', brandId,'\n################\n');

            // Get file information from memory storage
            const { originalname, mimetype, path } = req.file;

            // Process the file based on its type
            let importResult;

            // Send to service for processing
            importResult = await clientServices.importDatabase({
                fileName: originalname,
                fileType: mimetype,
                filePath: path,
            }, brandId);

            // Delete the file when you are done with it
            if (req?.file?.path) unlink(req.file.path);

            return res.status(200).json({
                success: true,
                message: "File imported successfully",
                data: importResult,
            });
        } catch (err) {
            // When the error happen make sure to delete the file
            if (req?.file?.path) unlink(req.file.path);

            console.error(
                "Unexpected error in importDatabase controller:",
                err
            );
            next(err);
        }
    }

    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateClient(req, res, next) {
        try {
            const { id } = req.params;
            const { data } = req.body;

            const client = await clientServices.updateClient(id, data);

            res.status(200).json({
                success: true,
                message: "Client updated successfully",
                data: client,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new ClientControllers();
