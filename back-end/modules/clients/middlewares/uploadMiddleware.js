import multer from "multer";
import APIError from "../../../utils/APIError.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// File filter function
function fileFilter(req, file, cb) {
    // Accept only csv and excel files
    const allowedFileTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
    ];

    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Invalid file type. Only CSV and Excel files are allowed."
            ),
            false
        );
    }
}

// Create multer instance with configuration
const upload = multer({
    storage: multer.diskStorage({
        // destination: function (req, file, cb) {
        //     // Temp folder because this file will not be saved in the disk
        //
        // },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        },
    }),
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 800, // 800MB max file size
    },
});

// Middleware for single file upload
export const uploadFile = upload.single("file");

// Error handling middleware for multer errors
export function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === "LIMIT_FILE_SIZE") {
            return next(
                new APIError(
                    "File too large. Maximum file size is 800MB.",
                    400,
                    "LIMIT_FILE_SIZE"
                )
            );
        }

        return next(err);
    } else if (err) {
        // An unknown error occurred
        return next(err);
    }

    // If no error, continue
    next();
}
