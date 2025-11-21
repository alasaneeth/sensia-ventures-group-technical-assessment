import fs from "fs";
import path from "path";
import crypto from "crypto";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { formatDate } from "date-fns";
import extractTitle from "../../../utils/extractTitle.js";

// Get the root directory dynamically
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../");

/**
 * Generate a random filename with the given extension
 * @param {string} extension - File extension (without dot)
 * @returns {string} - Random filename with extension
 */
function generateRandomFilename(extension = "csv") {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    return `${timestamp}_${randomString}.${extension}`;
}

/**
 * Generate CSV file from offer print data
 * @param {Array} printRecords - Array of print records with client and offer data
 * @param {string} fileName - Name of the CSV file to generate
 * @returns {Promise<string>} - Path to the generated CSV file
 */
export async function generateOfferCSV(
    printRecords,
    fileName,
    isHistory = false
) {
    try {
        // Define CSV headers
        const headers = [
            "Data Entry Code",
            "Campaign Code",
            "Offer",
            "Return Address",
            "Mail Date",
            "Payee Name",
            "Client ID",
            "Client Title",
            "First Name",
            "Last Name",
            "Gender",
            "Phone",
            "State",
            "City",
            "ZIP Code",
            "Country",
            "Address 1",
            "Address 2",
            "Address 3",
        ];

        let rows = [];

        // Create CSV rows in this way if it's not a history records
        if (!isHistory) {
            rows = printRecords.map((record) => {
                // When it's not history record

                const client = record.client || {};
                const offer = record.offer || {};
                let offerDetails = record.offer.offerCampaigns;
                if (Array.isArray(offerDetails)) {
                    offerDetails = offerDetails[0];
                }

                return [
                    escapeCSV(record.offerCode || ""),
                    escapeCSV(record.campaign?.code || ""),
                    escapeCSV(offer.title || ""),
                    escapeCSV(offerDetails.returnAddress?.address || ""),
                    escapeCSV(
                        formatDate(record.availableAt, "dd/MM/yyyy") || ""
                    ),
                    escapeCSV(offerDetails?.payeeName?.name || ""),
                    client.id || "",
                    escapeCSV(extractTitle(client?.gender, client?.country)),
                    escapeCSV(client?.firstName || ""),
                    escapeCSV(client?.lastName || ""),
                    escapeCSV(client.gender || ""),
                    escapeCSV(client.phone || ""),
                    escapeCSV(client.state || ""),
                    escapeCSV(client.city || ""),
                    escapeCSV(client.zipCode || ""),
                    escapeCSV(client.country || ""),
                    escapeCSV(client.address1 || ""),
                    escapeCSV(client.address2 || ""),
                    escapeCSV(client.address3 || ""),
                    // client.birthDate || "",
                ].join("\t");
            });
        } else {
            // This contains the common data
            const records = printRecords.printHistoryRecords;

            rows = records.map((record) => {
                return [
                    escapeCSV(record.dataEntryCode || ""),
                    escapeCSV(record.campaignCode || ""),
                    escapeCSV(printRecords.offer || ""),
                    escapeCSV(printRecords.returnAddress || ""),
                    escapeCSV(formatDate(record.mailDate, "dd/MM/yyyy") || ""),
                    escapeCSV(printRecords?.payeeName || ""),
                    record.clientId || "",
                    escapeCSV(extractTitle(record.gender, record.country)),
                    escapeCSV(record?.firstName || ""),
                    escapeCSV(record?.lastName || ""),
                    escapeCSV(record?.gender || ""),
                    escapeCSV(record.phone || ""),
                    escapeCSV(record.state || ""),
                    escapeCSV(record.city || ""),
                    escapeCSV(record.zipCode || ""),
                    escapeCSV(record.country || ""),
                    escapeCSV(record.address1 || ""),
                    escapeCSV(record.address2 || ""),
                    escapeCSV(record.address3 || ""),
                ].join("\t");
            });
        }

        // Combine headers and rows (use tab delimiter for UTF-16LE Excel compatibility)
        const csvContent = [headers.join("\t"), ...rows].join("\r\n");

        // Create uploads/prints directory if it doesn't exist
        const uploadsDir = path.join(rootDir, "uploads/prints");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate random filename if not provided
        const finalFileName = fileName || generateRandomFilename("csv");

        // Generate file path
        const filePath = path.join(uploadsDir, finalFileName);

        // Write CSV file with UTF-16LE encoding and BOM for Excel compatibility
        // UTF-16LE BOM is 0xFF 0xFE
        const bom = Buffer.from([0xff, 0xfe]);
        const content = Buffer.from(csvContent, "utf16le");
        const fileContent = Buffer.concat([bom, content]);

        fs.writeFileSync(filePath, fileContent);

        return filePath;
    } catch (error) {
        console.error("Error generating CSV:", error);
        throw error;
    }
}

/**
 * Escape CSV values to handle commas, quotes, and newlines
 * @param {string} value - Value to escape
 * @returns {string} - Escaped value
 */
function escapeCSV(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Delete the file after exporting to client
 * @param {string} filePath - Path to the file
 * @returns {string} - Path to the preserved file
 */
export function deleteCSVFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error("Error accessing file:", error);
        return null;
    }
}
