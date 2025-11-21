import { sendGermany } from "../../../utils/germanyConverter.js";
import reader, { excelSerialToISODate } from "../../../utils/readFileLines.js";
import Client from "../models/client.js";
import Comment from "../models/comments.js";
import sequelize from "../../../config/sequelize.js";

export const CLIENT_COLUMNS = [
    "gender_code",
    "firstname",
    "lastname",
    "address_1",
    "address_2",
    "address_3",
    "state",
    "city",
    "zip_code",
    "country",
    "birthdate",
    "phone_number",
    "list_owner",
    "record_last_purchase_date",
    "number_of_orders",

    // Comments part
    "date_internal_comment",
    "internal_comment",
];

function gender(genderCode) {
    switch (genderCode.toLowerCase().trim()) {
        case "m":
            return "male";
        case "f":
            return "female";
        default:
            return "not sure";
    }
}

export async function parseClientsFile(
    filePath,
    fileName, // optional: if you want to store where it came from
    transaction = null,
    {
        sheetName = "Feuil1", // you can override
        batchSize = 200, // tweak as you like
        headerRowIndex = 1, // first row is headers by default
        brandId = null, // Optional brandId for imported clients
    } = {}
) {
    let curTransaction = null;
    if (transaction) {
        curTransaction = transaction;
    } else {
        curTransaction = await sequelize.transaction();
    }

    // Create a single date for all records
    const now = new Date();

    try {
        // Start streaming the Excel sheet
        let gen = reader(filePath, {
            engine: "excel",
            sheetName,
            batchSize,
            headerRowIndex,
            typesHint: {
                record_last_purchase_date: excelSerialToISODate,
                date_internal_comment: excelSerialToISODate,
                birthdate: excelSerialToISODate,
            },
        });

        let cachedHeaders = null;

        for await (const chunk of gen) {
            // First object yielded by reader in excel mode may carry headers
            if (chunk.headers && !cachedHeaders) {
                cachedHeaders = chunk.headers;
                // You can validate/compare with MARKETING_COLUMNS here if you want.
                // Example: check required columns exist, normalize casing, etc.
                // console.log("Detected headers:", cachedHeaders);
                continue; // headers-only patch; move on to data
            }

            const rows = chunk.rows || [];
            if (rows.length === 0) continue;

            // Group the user data
            const clientsToCreate = [];

            rows.map((r) => {
                const base = {
                    gender: gender(r["gender_code"]),
                    firstName: r["firstname"] ?? null,
                    lastName: r["lastname"] ?? null,
                    address1: r["address_1"] ?? null,
                    address2: r["address_2"] ?? null,
                    address3: r["address_3"] ?? null,
                    state: r["state"] ?? null,
                    city: r["city"] ?? null,
                    zipCode: r["zip_code"] ?? null,
                    country:
                        sendGermany(r["country"])?.trim()?.toLowerCase() ??
                        null,
                    birthDate: r["birthdate"] ?? null,
                    phone: r["phone_number"] ?? null,
                    listOwner: r["list_owner"] ?? null,
                    lastPurchaseDate: r["record_last_purchase_date"] ?? null,
                    totalOrders: r["number_of_orders"] ?? null,
                    brandId: brandId || null,
                    createdAt: now,
                    updatedAt: now,
                };

                const comment = {
                    comment: r["internal_comment"] ?? null,
                    createdAt: r["date_internal_comment"] ?? null,
                };

                clientsToCreate.push({ client: base, comment });
            });

            // Now extract the clients and create them
            let clients = clientsToCreate.map((record) => ({
                ...record.client,
            }));

            clients = await Client.bulkCreate(clients, {
                transaction: curTransaction,
                returning: true,
            });

            // Prepare the comments - filter out null comments
            let comments = clientsToCreate
                .map((c, i) => {
                    return { clientId: clients.at(i).id, ...c.comment };
                })
                .filter((comment) => comment.comment !== null);

            // Create them only if there are comments
            if (comments.length > 0) {
                comments = await Comment.bulkCreate(comments, {
                    transaction: curTransaction,
                    returning: true,
                });
            }

            if (!transaction) {
                await curTransaction.commit();
            }
        }
    } catch (err) {
        if (!transaction) {
            await curTransaction.rollback();
        }
        throw err;
    }
}
