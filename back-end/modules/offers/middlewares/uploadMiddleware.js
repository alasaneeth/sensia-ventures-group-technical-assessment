import multer from "multer";
import APIError from "../../../utils/APIError.js";

// File filter function
function fileFilter(req, file, cb) {
    // Accept only CSV, Excel, and TXT files
    const allowedFileTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel.sheet.macroenabled.12",
        "text/plain",
    ];

    // Fallback extension check
    const allowedExtensions = [".csv", ".xls", ".xlsx", ".xlsm", ".txt"];
    const fileExt = file.originalname
        .slice(file.originalname.lastIndexOf("."))
        .toLowerCase();

    if (
        allowedFileTypes.includes(file.mimetype) ||
        allowedExtensions.includes(fileExt)
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Invalid file type. Only CSV, Excel (.xls, .xlsx, .xlsm), and TXT files are allowed."
            ),
            false
        );
    }
}


// Create multer instance with configuration
const upload = multer({
    storage: multer.diskStorage({
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
