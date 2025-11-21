// parsers/parseMarketingSheet.js
import sequelize from "../../../config/sequelize.js";
import loggingService from "../../../services/logging.js";
import { checkGermany, sendGermany } from "../../../utils/germanyConverter.js";
import { parseISODateSafe } from "../../../utils/parseDateSafe.js";
import reader, { excelSerialToISODate } from "../../../utils/readFileLines.js";
import Address from "../../campaigns/models/address.js";
import Campaign from "../../campaigns/models/campaign.js";
import CampaignOffer from "../../campaigns/models/campaignOffer.js";
import PaymentMethod from "../../settings/models/paymentMethod.js";
import PayeeName from "../../settings/models/payeeName.js";
import Chain from "../models/chain.js";
import ChainOffer from "../models/chainOffer.js";
import Offer from "../models/offer.js";
import OfferSequence from "../models/offerSequence.js";
import countryCurrencies from "../../../utils/currencyMap.js";
import { parse, isValid } from "date-fns";

function takeStatus(warning) {
    if (warning.toLowerCase().trim() === "normal") return "normal";
    return "closed";
}

let printTwice = 2;
/**
 * Column names you provided, in order, to help with mapping/placeholders.
 * We'll read them from the sheet header at runtime, but this is a handy list.
 */
export const MARKETING_COLUMNS = [
    "Porteur",
    "Owner",
    "Theme",
    "Grade",
    "Country",
    "Language",
    "Language_code",
    "Version",
    "Origin",
    "Chain",

    "Code Offer 1",
    "Description Offer 1",
    "Dependency Offer 1",
    "Date of generation 1",

    "Code Offer 2",
    "Description Offer 2",
    "Dependency Offer 2",
    "Date of generation 2",

    "Code Offer 3",
    "Description Offer 3",
    "Dependency Offer 3",
    "Date of generation 3",

    "Code Offer 4",
    "Description Offer 4",
    "Dependency Offer 4",
    "Date of generation 4",

    "Code Offer 5",
    "Description Offer 5",
    "Dependency Offer 5",
    "Date of generation 5",
];

export const MAIL_PLAN_COLUMNS = [
    "Mail date",
    "Country",
    "Campaign_code",
    "Chain",
    "Offer",
    "Printer",
    "Extracted qty",

    // Set this to country
    "Payment method",
    // Set this to offer
    "Payee name (check only)",

    // Set this to address
    "PO Box for Main Mailing",
    "Country of the Po Box",

    "Warning_1",
    "Warning_2",
];

/**
 * Simple example: stream rows from the "marketing" sheet (2nd sheet).
 * - Saves headers from the first emitted patch (you only get them once).
 * - Processes subsequent row batches in a memory-friendly way.
 *
 * Replace the "TODO" with your own persistence/business logic.
 */
export async function parseMarketingExcel(
    filePath,
    fileName, // optional: if you want to store where it came from
    transaction = null,
    {
        sheetName = "marketing", // you can override
        batchSize = 200, // tweak as you like
        headerRowIndex = 1, // first row is headers by default
    } = {}
) {
    let curTransaction = null;
    if (transaction) {
        curTransaction = transaction;
    } else {
        curTransaction = await sequelize.transaction();
    }
    try {
        // Start streaming the Excel sheet
        let gen = reader(filePath, {
            engine: "excel",
            sheetName,
            batchSize,
            headerRowIndex,
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

            // To Know from where to where :)
            let offerTransitions = {};

            // --- Example transformation (placeholder) ---
            // Create a normalized object per row, and extract "offers" 1..7
            const transformed = rows.map((r) => {
                const base = {
                    porter: r["Porteur"]?.trim() ?? null,
                    owner: r["Owner"]?.trim() ?? null,
                    theme: r["Theme"]?.trim() ?? null,
                    grade: r["Grade"]?.trim() ?? null,
                    description: r["General description"]?.trim() ?? null,
                    country:
                        sendGermany(r["Country"])?.trim()?.toLowerCase() ??
                        null,
                    language: r["Language"]?.trim() ?? null,
                    languageCode: r["Language_code"]?.trim() ?? null,
                    version: r["Version"]?.trim() ?? null,
                    origin: r["Origin"]?.trim() ?? null,
                    chain: r["Chain"]?.trim() ?? null,

                    // controlSameGiftInChain:
                    //     r["Control if same gift in chain"] ?? null,
                    // importedFrom: fileName ?? null,
                };
                if (printTwice--) {
                    console.log(
                        "\n######## offer type ########\n",
                        r,
                        "\n################\n"
                    );
                }

                // Collect up to 5 offers
                const offers = [];
                for (let i = 1; i <= 5; i++) {
                    // Take the dependncy offer
                    const depenencyOffer = r[`Dependency Offer ${i}`];
                    const type = r[`Description Offer ${i}`];
                    const daysToAdd = r[`Date of generation ${i}`];

                    const code = r[`Code Offer ${i}`] ?? null;
                    if (code) {
                        offers.push({ index: i, code, type });
                    }

                    if (
                        depenencyOffer &&
                        code &&
                        !offerTransitions[depenencyOffer]
                    ) {
                        // Note from the depenency to the offer
                        offerTransitions[depenencyOffer] = [
                            { code, daysToAdd },
                        ];
                    } else if (depenencyOffer && code) {
                        offerTransitions[depenencyOffer].push({
                            code,
                            daysToAdd,
                        });
                    }
                }

                return { ...base, offers };
            });

            // if (printTwice--)
            //     console.log(
            //         "\n######### Line #######\n",
            //         transformed,
            //         "\n################\n"
            //     );

            // Create the offers first for each chain
            let offersChains = {};
            transformed.map((offer, i) => {
                offersChains[i] = {
                    chain: offer.chain,
                    offers: [],
                };

                return offer.offers.map((o) => {
                    offersChains[i].offers.push({
                        title: o.code,
                        porter: offer.porter,
                        owner: offer.owner,
                        theme: offer.theme,
                        grade: offer.grade,
                        country: offer.country,
                        language: offer.language,
                        version: offer.version,
                        origin: offer.origin,
                        type: o.type,
                        description: o.description,
                    });
                });
            });

            // let offers;
            // if (printTwice - 1) {
            //     console.log(
            //         "\n######## theeeee ########\n",
            //         offersChains,
            //         "\n################\n"
            //     );
            // }

            for (const key of Object.keys(offersChains)) {
                let { chain, offers } = offersChains[key];

                // Create the offers
                offers = await Offer.bulkCreate(offers, {
                    transaction: curTransaction,
                    returning: true,
                });

                // Change the transition from codes to IDs

                let offerTransitionsIds = {};
                // Exctract all IDs
                offers.forEach((offer) => {
                    // Take the destination
                    const toOffer = offerTransitions[offer.title];

                    if (!toOffer) return;

                    offerTransitions[offer.title].forEach((toOffer) => {
                        // Find the id for the destination offer
                        const destinationOfferId = offers.find(
                            (offer) => offer.title === toOffer.code
                        ).id;

                        // Save the transition
                        if (offerTransitionsIds[offer.id]) {
                            offerTransitionsIds[offer.id].push({
                                id: destinationOfferId,
                                daysToAdd: toOffer.daysToAdd,
                            });
                        } else {
                            offerTransitionsIds[offer.id] = [
                                {
                                    id: destinationOfferId,
                                    daysToAdd: toOffer.daysToAdd,
                                },
                            ];
                        }
                    });
                    // Find the id for the destination offer
                    // const destinationOfferId = offers.find(
                    //     (offer) => offer.title === toOffer.code
                    // ).id;

                    // // Save the transition
                    // offerTransitionsIds[offer.id] = {
                    //     id: destinationOfferId,
                    //     daysToAdd: toOffer.daysToAdd,
                    // };
                });

                // create the chain
                let chainEntry;

                chainEntry = await Chain.create(
                    {
                        title: chain,
                        offerSequenceId: null,
                    },
                    { transaction: curTransaction, returning: true }
                );

                // Create the offer sequecnes
                let sequencesToCreate = [];
                offers.map((offer, i) => {
                    if (offerTransitionsIds[offer.id]) {
                        // Remeber the offer can lead to many offers
                        offerTransitionsIds[offer.id].forEach((obj) => {
                            sequencesToCreate.push({
                                currentOfferId: offer.id,
                                nextOfferId: obj.id,
                                daysToAdd: obj.daysToAdd,
                                chainId: chainEntry.id,
                            });
                        });
                    } else {
                        sequencesToCreate.push({
                            currentOfferId: offer.id,
                            nextOfferId: null,
                            daysToAdd: -1,
                            chainId: chainEntry.id,
                        });
                    }
                });

                sequencesToCreate = await OfferSequence.bulkCreate(
                    sequencesToCreate,
                    {
                        transaction: curTransaction,
                        returning: true,
                    }
                );

                // Update the chain record to link it to the first sequence
                await chainEntry.update(
                    {
                        offerSequenceId: sequencesToCreate[0].id,
                    },
                    { transaction: curTransaction }
                );

                // Build the offers graph from sequences to calculate levels (similar to chainServices.js)
                const offersGraph = {};
                sequencesToCreate.forEach((seq) => {
                    if (!offersGraph[seq.currentOfferId]) {
                        offersGraph[seq.currentOfferId] = [];
                    }
                    if (seq.nextOfferId) {
                        offersGraph[seq.currentOfferId].push({
                            offerId: seq.nextOfferId,
                            daysToAdd: seq.daysToAdd,
                        });
                    }
                });

                // Find the first offer (the one referenced by chain.offerSequenceId)
                const firstSequence = sequencesToCreate[0];
                const firstOfferId = firstSequence.currentOfferId;

                // Calculate levels using BFS like in chainServices.js
                const visited = new Set();
                const offerLevels = {};

                function calculateLevels(offerId, level) {
                    if (visited.has(offerId)) return;
                    visited.add(offerId);
                    offerLevels[offerId] = level;

                    if (offersGraph[offerId]) {
                        offersGraph[offerId].forEach(
                            ({ offerId: nextOfferId }) => {
                                calculateLevels(nextOfferId, level + 1);
                            }
                        );
                    }
                }

                // Start BFS from the first offer
                if (firstOfferId) {
                    calculateLevels(firstOfferId, 1);
                }

                // Create ChainOffer records based on calculated levels
                const chainOffersToCreate = [];
                for (const [offerId, level] of Object.entries(offerLevels)) {
                    chainOffersToCreate.push({
                        offerId: offerId,
                        chainId: chainEntry.id,
                        index: level,
                    });
                }

                // Bulk create the ChainOffer records
                if (chainOffersToCreate.length > 0) {
                    await ChainOffer.bulkCreate(chainOffersToCreate, {
                        transaction: curTransaction,
                    });
                }
            }
        }
        /////////////////////////////////////// Campaigns part
        // Start streaming the Excel sheet
        gen = reader(filePath, {
            engine: "excel",
            sheetName: "MAIL PLAN",
            batchSize,
            headerRowIndex,
            typesHint: {
                "Mail date": excelSerialToISODate,
            },
        });

        cachedHeaders = null;

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

            await Promise.all(
                rows.map(async (r) => {
                    console.log(
                        "\n######### campaign row #######\n",
                        r,
                        "\n################\n"
                    );
                    const base = {
                        mailDate: r["Mail date"] ?? null,
                        country:
                            sendGermany(r["Country"])?.trim()?.toLowerCase() ??
                            null,
                        campaignCode: r["Campaign_code"]?.trim() ?? null,
                        chainId: r["Chain"]?.trim() ?? null,
                        offerId: r["Offer"]?.trim() ?? null,
                        printer: r["Printer"]?.trim() ?? null,
                        mailQuantity: r["Extracted qty"] ?? null,

                        // Set this to country
                        paymentMethod: r["Payment method"]?.trim() ?? null,
                        // Set this to offer
                        payeeName: r["Payee name (check only)"]?.trim() ?? null,

                        // Set this to address
                        address: r["PO Box for Main Mailing"]?.trim() ?? null,
                        addressCountry:
                            sendGermany(r["Country of the Po Box"])
                                ?.trim()
                                ?.toLowerCase() ?? null,
                        warning1: r["Warning_1"]?.trim() ?? null,
                        warning2: r["Warning_2"]?.trim() ?? null,

                        // Set also this to the address. in case it's not the same
                        addressChain: r["PO Box for the Chain"]?.trim() ?? null,
                        addressChainCountry:
                            r["Country of the Po Box2"]
                                ?.trim()
                                ?.toLowerCase() ?? null,
                        addressChainWarning1: r["Warning12"]?.trim() ?? null,
                        addressChainWarning2: r["Warning23"]?.trim() ?? null,
                    };

                    let address = { id: null };
                    let chainAddress = { id: null };
                    if (base.address) {
                        const [addressInstance] = await Address.upsert(
                            {
                                address: base.address,
                                country: base.addressCountry,
                                warning1: base.warning1,
                                warning2: base.warning2,
                                status: takeStatus(base.warning2),
                            },
                            {
                                transaction: curTransaction,
                                returning: true,
                                conflictFields: ["address"],
                            }
                        );
                        address = addressInstance;
                    }

                    if (base.addressChain) {
                        if (
                            base.address.trim() === base.addressChain.trim() &&
                            base.addressCountry === base.addressChainCountry
                        ) {
                            // Give it t
                            // he same object
                            chainAddress = address;
                        } else {
                            const [chainAddressInstance] = await Address.upsert(
                                {
                                    address: base.addressChain,
                                    country: base.addressChainCountry,
                                    warning1: base.addressChainWarning1,
                                    warning2: base.addressChainWarning2,
                                },
                                {
                                    transaction: curTransaction,
                                    returning: true,
                                    conflictFields: ["address"],
                                }
                            );
                            chainAddress = chainAddressInstance;
                        }
                    }

                    let payMethods = null;
                    if (base.paymentMethod) {
                        if (base.paymentMethod?.includes("+"))
                            payMethods = base?.paymentMethod
                                .trim()
                                .split(" + ")
                                .join(",")
                                .toLowerCase();
                        else {
                            payMethods = base.paymentMethod
                                .trim()
                                .toLowerCase();
                        }
                        // payement methods
                        await PaymentMethod.upsert(
                            {
                                country: base.country,
                                paymentMethod: payMethods,
                            },
                            {
                                transaction: curTransaction,
                                returning: true,
                                conflictFields: ["country"],
                            }
                        );
                    }

                    // For campaigns we need the chain id. and update the offer payee name
                    const chain = await Chain.findOne({
                        attributes: ["id"],
                        where: { title: base.chainId },
                        transaction: curTransaction,
                    });

                    if (!chain) {
                        loggingService.emit(
                            "log",
                            `Chain not found: "${base.chainId}" for campaign "${base.campaignCode}"`
                        );
                        throw new Error(
                            `Chain "${base.chainId}" not found in database`
                        );
                    }

                    // Update the return address on the chain
                    // await chain.update(
                    //     // { returnAddressId: chainAddress.id },
                    //     { transaction: curTransaction }
                    // );

                    let payeeName = { id: null };

                    if (base.payeeName) {
                        [payeeName] = await PayeeName.upsert(
                            {
                                name: base.payeeName,
                            },
                            {
                                transaction: curTransaction,
                                returning: true,
                                conflictFields: ["name"],
                            }
                        );
                    }

                    // Update the offer payee name for every offer in the chain
                    const offerSequences = await OfferSequence.findAll({
                        where: { chainId: chain.id },
                        include: {
                            model: Offer,
                            as: "currentOffer",
                            attributes: ["title"],
                        },
                        transaction: curTransaction,
                    });

                    // Remember the offer can lead to many offers so that's why we need a set
                    const allOfferIds = new Set();
                    let firstOfferId = null;
                    const offerGroups = [];

                    // Collect all unique offer IDs from sequences
                    offerSequences.forEach((offerSequence) => {
                        // Check if this is the first offer
                        if (
                            offerSequence.currentOffer.title === base.offerId &&
                            !firstOfferId
                        ) {
                            firstOfferId = offerSequence.currentOfferId;
                        }

                        // Add all offers to the set
                        allOfferIds.add(offerSequence.currentOfferId);
                        if (offerSequence.nextOfferId) {
                            allOfferIds.add(offerSequence.nextOfferId);
                        }
                    });

                    // Create the campaign
                    const campaign = await Campaign.create(
                        {
                            code: base.campaignCode,
                            country: base.country,
                            chainId: chain.id,
                            mailQuantity: base.mailQuantity,
                            isExtracted: Boolean(base.mailQuantity),
                            mailDate: base.mailDate,
                        },
                        { transaction: curTransaction }
                    );

                    // Get ChainOffer records to determine the order of offers
                    const chainOffers = await ChainOffer.findAll({
                        where: { chainId: chain.id },
                        order: [["index", "ASC"]],
                        transaction: curTransaction,
                    });

                    // Create CampaignOffer records for each offer with proper payeeName, printer, and returnAddress
                    const campaignOffers = [];
                    for (const chainOffer of chainOffers) {
                        const isFirstOffer = chainOffer.index === 1;

                        // Get currency symbol from countryCurrencies map with case-insensitive access
                        let currency = "$"; // Default currency
                        if (base.country) {
                            const countryLower = base.country.toLowerCase();
                            // Check if country exists in the map
                            if (countryCurrencies[countryLower]) {
                                currency = countryCurrencies[countryLower];
                            } else if (countryLower === "germany") {
                                currency = "€"; // Special case for Germany
                            }
                        }

                        campaignOffers.push({
                            campaignId: campaign.id,
                            offerId: chainOffer.offerId,
                            payeeNameId: payeeName.id,
                            returnAddressId: isFirstOffer
                                ? address.id
                                : chainAddress.id,
                            printer: base.printer,
                            fixedCost: 0, // Default value
                            currency: currency,
                        });
                    }

                    // Bulk create all CampaignOffer records
                    if (campaignOffers.length > 0) {
                        await CampaignOffer.bulkCreate(campaignOffers, {
                            transaction: curTransaction,
                        });
                    }
                })
            );
        }

        if (!transaction) await curTransaction.commit();

        return true;
    } catch (err) {
        // if (!transaction) await curTransaction.rollback();
        throw err;
    }
}
