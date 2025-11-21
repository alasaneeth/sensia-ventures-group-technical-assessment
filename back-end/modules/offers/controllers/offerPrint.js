import APIError from "../../../utils/APIError.js";
import path from "path";

import offerPrintServices from "../services/offerPrint.js";

class OfferPrintControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getPrinterRecords(req, res, next) {
        try {
            // Extract pagination parameters from query
            const page = parseInt(req.query.page) || 1;
            const rowsPerPage = parseInt(req.query.rows_per_page) || 10;
            const { filters } = req?.query;

            const offset = (page - 1) * rowsPerPage;
            const maxLimit = Math.min(rowsPerPage, 200);

            const result = await offerPrintServices.getPrinterRecords(
                offset,
                maxLimit,
                filters
            );

            res.status(200).json({
                success: true,
                data: result.offers,
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
    async getPrinterHistory(req, res, next) {
        try {
            // Extract pagination parameters from query
            const page = parseInt(req.query.page) || 1;
            const rowsPerPage = parseInt(req.query.rows_per_page) || 10;
            const { filters } = req?.query;
            const offset = (page - 1) * rowsPerPage;
            const maxLimit = Math.min(rowsPerPage, 200);

            const result = await offerPrintServices.getPrinterHistory(
                offset,
                maxLimit,
                filters
            );

            res.status(200).json({
                success: true,
                data: result.offers,
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
    async printRecords(req, res, next) {
        try {
            const {
                offerId,
                offerTitle,
                returnAddress,
                returnAddressId,
                availableAt,
                quantity,
                payeeName,
                payeeNameId,
                dateType,
                printer,
                companyId,
                brandId,
            } = req.body;

            if (!offerId || !offerTitle || !availableAt || !dateType) {
                throw new APIError("Missing required parameters", 400);
            }

            const result = await offerPrintServices.printRecords({
                offerId,
                offerTitle,
                returnAddress,
                returnAddressId,
                availableAt,
                quantity,
                payeeName,
                payeeNameId,
                dateType,
                printer,
                companyId,
                brandId,
            });

            // Explicitly set Content-Disposition and Content-Type
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${encodeURIComponent(result.fileName)}"`
            );
            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Access-Control-Expose-Headers",
                "Content-Disposition"
            );

            // Send the CSV file to the client
            res.download(result.filePath, result.fileName, (err) => {
                if (err) {
                    console.error("Error sending file:", err);
                    if (!res.headersSent) {
                        return next(err);
                    }
                }

                // Delete the file after sending (fire and forget)
                result.cleanup();
            });

            console.log("\n################\n", "\n################\n");
            console.log("REACHED ?");
        } catch (err) {
            next(err);
        }
    }

    /**
     * Controller to get and send an exported offer file
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async printHistoryRecords(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Export ID is required",
                });
            }

            // Get file info from service
            const fileInfo = await offerPrintServices.printHistoryRecords(id);

            // Get the original filename from the path
            const originalFilename = path.basename(fileInfo.filePath);

            // Set headers to force download with original filename
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${originalFilename}"`
            );
            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Access-Control-Expose-Headers",
                "Content-Disposition"
            );

            // Send the file as a download
            return res.download(fileInfo.filePath, originalFilename, (err) => {
                if (err) {
                    console.error("Error sending file:", err);
                    // If headers are already sent, we can't send an error response
                    if (!res.headersSent) {
                        return res.status(500).json({
                            success: false,
                            message: "Error sending file",
                        });
                    }
                }

                // Delete the file
                fileInfo.cleanup();
            });
        } catch (err) {
            console.error("Error in getExportedOfferFile controller:", err);

            // If headers are already sent, pass to next error handler
            if (res.headersSent) {
                return next(err);
            }

            // Otherwise send error response
            return res.status(500).json({
                success: false,
                message: err.message || "Error retrieving exported file",
            });
        }
    }
}

export default new OfferPrintControllers();
