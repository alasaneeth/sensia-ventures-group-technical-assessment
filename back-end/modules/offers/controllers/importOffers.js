import loggingService from "../../../services/logging.js";
import APIError from "../../../utils/APIError.js";
// import { importOffers as importOffersService } from "../services/offersServices.js";
import { importOffers as importOffersService } from "../services/importAllData.js";
import { unlink } from "fs/promises";

/**
 * ------------------>  This maybe get deleted in the future  <------------------------
 * Controller to handle file upload and offer import
 * @param {import('express').Request} req - Express request object with file attached by multer
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export default async function importOffers(req, res, next) {
    try {
        // Check if file exists in request
        if (!req.file) {
            return next(new APIError("No file uploaded", 400));
        }

        // Get file information from memory storage
        const { originalname, mimetype, path } = req.file;

        console.log(
            "File received for processing:",
            [originalname, mimetype, path].join("\n\n")
        );

        // Send to service for processing
        const importResult = await importOffersService({
            fileName: originalname,
            fileType: mimetype,
            filePath: path,
        });

        console.log("DONE ?");

        // Delete the file when you are done with it
        if (req?.file?.path) await unlink(req.file.path);

        return res.status(200).json({
            success: true,
            message: "Offer file imported successfully",
            data: importResult,
        });
    } catch (err) {
        // When the error happens make sure to delete the file
        if (req?.file?.path) await unlink(req.file.path);

        loggingService.emit("log", err.message);

        console.error("Unexpected error in importOffers controller:", err);
        next(err);
    }
}
