import { Sequelize, Transaction } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Chain from "../models/chain.js";
import OfferSequence from "../models/offerSequence.js";
import Offer from "../models/offer.js";
import APIError from "../../../utils/APIError.js";
import Address from "../../campaigns/models/address.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import PayeeName from "../../settings/models/payeeName.js";
import Brand from "../../companies/models/brand.js";
import Company from "../../companies/models/company.js";

import ChainOffer from "../models/chainOffer.js";
class ChainServices {
    /**
     * Get chains with pagination (simplified for table view)
     * @param {number} offset - Number of records to skip
     * @param {number} limit - Number of items per page
     * @returns {Promise<Object>} - Chains with pagination info
     */
    async getChains(offset = 0, limit = 10, filters = null) {
        try {
            let whereClause = {};
            
            if (filters) {
                whereClause = filtersParser(filters);
            }

            console.log(
                "\n################\n",
                filters,
                "\n################\n"
            );


            // Get chains with pagination and basic info only
            const { rows: chains, count: totalCount } =
                await Chain.findAndCountAll({
                    where: whereClause,
                    limit,
                    offset,
                    order: [["createdAt", "DESC"]],
                    include: [
                        {
                            model: Brand,
                            as: "brand",
                            attributes: ["id", "name", "companyId"],
                            include: [
                                {
                                    model: Company,
                                    as: "company",
                                    attributes: ["id", "name"],
                                },
                            ],
                        },
                    ],
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            // Return chains with pagination info
            return {
                data: chains,
                pagination: {
                    total: totalCount,
                    page: currentPage,
                    limit,
                    pages: totalPages,
                },
            };
        } catch (error) {
            console.error("Error fetching chains:", error);
            throw error;
        }
    }
    /**
     * Get a specific chain with all its offer sequences in graph adjacency list format
     * @param {number} chainId - Chain ID
     * @returns {Promise<Object>} - Chain with offers in graph format
     */
    async getChainById(chainId) {
        try {
            // Get the chain basic info
            const chain = await Chain.findByPk(chainId, {
                // include: {
                //     model: Address,
                //     as: "returnAddress",
                // },
            });

            if (!chain) {
                throw new APIError("Chain not found", 404, "CHAIN_NOT_FOUND");
            }

            // Get the first sequence for this chain
            const firstSequence = await OfferSequence.findByPk(
                chain.offerSequenceId
            );

            if (!firstSequence) {
                throw new APIError(
                    "Chain first sequence not found",
                    404,
                    "FIRST_SEQUENCE_NOT_FOUND"
                );
            }

            // let addFields = [];
            // if (campaignDetails?.id) {
            //     addFields = [
            //         [
            //             [
            //                 Sequelize.literal(
            //                     `
            //                     SELECT
            //                         SUM("amount") - SUM("discountAmount")
            //                     FROM orders WHERE "campaignId" = ${campaignDetails?.id}
            //                 `
            //                 ),
            //                 "totalAmount",
            //             ],
            //         ],
            //         [
            //             [
            //                 Sequelize.literal(
            //                     `
            //                     SELECT COUNT("id")
            //                     FROM orders WHERE "campaignId" = ${campaignDetails.id}
            //                 `
            //                 ),
            //                 "totalOrders",
            //             ],
            //         ],
            //     ];
            // }

            // Get all sequences that belong to this specific chain
            const allSequences = await OfferSequence.findAll({
                where: {
                    chainId: chainId, // Filter by chain ID to ensure uniqueness
                },
                include: [
                    {
                        model: Offer,
                        as: "currentOffer",
                        attributes: {
                            include: ["id", "title", "description"],
                        },
                    },
                    {
                        model: Offer,
                        as: "nextOffer",
                        attributes: {
                            include: ["id", "title", "description"],
                        },
                    },
                    // {
                    //     model: Address,
                    //     as: "address",
                    // },
                ],
            });

            const { offers, chainNodes, firstOffer } = this.prepareChainGraph(
                allSequences,
                firstSequence
            );

            // Return chain in the same format as input with added timestamps and offer details
            return {
                ...chain.dataValues,
                offers,
                chainNodes,
                firstOffer,
            };
        } catch (error) {
            console.error("Error getting chain by ID:", error);
            throw error;
        }
    }

    /**
     * Create a new offer chain with sequences from graph adjacency list
     * @param {string} title - Chain title
     * @param {Object} offersGraph - Graph adjacency list of offers with connections
     * @param {string} firstOffer - ID of the first offer in the chain
     * @param {Array} offerReturnAddresses - Array of objects with offerId and returnAddress properties
     * @param {number} companyId - Company ID
     * @param {number} brandId - Brand ID (optional)
     * @returns {Promise<number>} - ID of the created chain
     */
    async createChain(title, offersGraph, firstOffer, offerReturnAddresses, companyId, brandId) {
        // Start a transaction to ensure all operations succeed or fail together
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        });

        try {
            // {
            //     '3': [],
            //     '4': [],
            //     '5': [ { offerId: '3', daysToAdd: 7 } ],
            //     '6': [ { offerId: '5', daysToAdd: 4 }, { offerId: '4', daysToAdd: 6 } ]
            //   }

            // Extract all unique offer IDs from the graph
            const offerIds = Object.keys(offersGraph).map((offerId) => offerId);

            // Create a map of offer IDs to return addresses for quick lookup
            const returnAddressMap = {};
            offerReturnAddresses.forEach((item) => {
                returnAddressMap[item.offerId] = item.returnAddress;
            });

            // Create offer sequences - one for each connection
            const sequencesToCreate = [];

            // Create the chain record first so we can get its ID
            const chain = await Chain.create(
                {
                    title,
                    offerSequenceId: null, // Will be updated later
                    brandId,
                },
                { transaction }
            );

            // Loop over the keys of the graph
            for (let i = 0; i < Object.keys(offersGraph).length; i++) {
                // Get the source offer ID
                const sourceOfferId = Object.keys(offersGraph)[i];

                // Loop over the edges and connect them
                for (let j = 0; j < offersGraph[sourceOfferId].length; j++) {
                    const targetOfferId = offersGraph[sourceOfferId][j].offerId;
                    const daysToAdd = offersGraph[sourceOfferId][j].daysToAdd;

                    sequencesToCreate.push({
                        currentOfferId: sourceOfferId,
                        nextOfferId: targetOfferId,
                        daysToAdd: daysToAdd,
                        chainId: chain.id, // Attach chain ID to each sequence
                        // returnAddressId: returnAddressMap[sourceOfferId], // Add return address from the map
                    });
                }

                // For all leaves they must get a record even if they are in at the end of the chain
                if (offersGraph[sourceOfferId].length === 0) {
                    sequencesToCreate.push({
                        currentOfferId: sourceOfferId,
                        nextOfferId: null, // Point to null
                        daysToAdd: -1, // This will not create any offer after it btw
                        chainId: chain.id, // Attach chain ID to each sequence
                        // returnAddressId: returnAddressMap[sourceOfferId], // Add return address from the map
                    });
                }
            }

            const sequences = await OfferSequence.bulkCreate(
                sequencesToCreate,
                {
                    transaction,
                }
            );

            // Use the provided firstOffer instead of detecting roots

            // Find the first sequence for the specified first offer
            let firstSequence = null;
            if (offersGraph[firstOffer] && offersGraph[firstOffer].length > 0) {
                // First offer has outgoing connections, find its first sequence
                firstSequence = sequences.find(
                    (seq) => seq.currentOfferId === firstOffer
                );
            }
            // Only when you do have more than one sequences to create
            else if (sequencesToCreate.length > 1) {
                // First offer is a leaf node (no outgoing connections)
                // We need to create a special sequence for the chain root
                firstSequence = await OfferSequence.create(
                    {
                        currentOfferId: firstOffer,
                        nextOfferId: null,
                        daysToAdd: 0,
                        chainId: chain.id, // Attach chain ID to this sequence too
                        // returnAddressId: returnAddressMap[firstOffer], // Add return address for first offer
                    },
                    { transaction }
                );
            }

            if (!firstSequence && sequencesToCreate.length > 1) {
                throw new APIError(
                    "Could not map starting offer to sequence",
                    500,
                    "SEQUENCE_MAPPING_ERROR"
                );
            }

            if (sequencesToCreate.length > 1)
                // Update the chain record to link it to the first sequence
                await chain.update(
                    {
                        offerSequenceId: firstSequence.id,
                    },
                    { transaction }
                );
            else {
                await chain.update(
                    {
                        offerSequenceId: sequences[0].id,
                    },
                    { transaction }
                );
            }

            // Now create the ChainOffer records to track the order of offers in the chain
            const chainOffers = [];
            const visited = new Set();
            const offerLevels = {};

            // Calculate the level (index) for each offer using BFS
            function calculateLevels(offerId, level) {
                if (visited.has(offerId)) return;

                visited.add(offerId);
                offerLevels[offerId] = level;

                // Process all children
                if (offersGraph[offerId]) {
                    offersGraph[offerId].forEach(({ offerId: nextOfferId }) => {
                        calculateLevels(nextOfferId, level + 1);
                    });
                }
            }

            // Start BFS from the first offer
            calculateLevels(firstOffer, 1);

            // Create ChainOffer records based on calculated levels
            for (const [offerId, level] of Object.entries(offerLevels)) {
                chainOffers.push({
                    offerId: offerId,
                    chainId: chain.id,
                    index: level,
                });
            }

            // Bulk create the ChainOffer records
            await ChainOffer.bulkCreate(chainOffers, { transaction });

            // Commit the transaction
            await transaction.commit();

            // Return only the chain ID
            return chain.id;
        } catch (error) {
            // Rollback the transaction if any error occurs
            await transaction.rollback();
            throw error;
        }
    }

    async deleteChain(id, deleteAssociatedOffers = false) {
        const t = await sequelize.transaction();
        try {
            const isChainDeleted = await Chain.destroy({
                where: {
                    id,
                },
                transaction: t,
            });

            // In the future get the offer sequences then get the offers from them and delete all of them
            // In case the user selected to delete the associated offers
            await OfferSequence.destroy({
                where: {
                    chainId: id,
                },
                transaction: t,
            });

            if (!isChainDeleted) {
                throw new APIError(
                    "Failed to delete chain or it's already deleted",
                    404
                );
            }

            // Delete the container also
            await ChainOffer.destroy({
                where: {
                    chainId: id,
                },
                transaction: t,
            });

            await t.commit();

            return isChainDeleted;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async updateChain(id, payload) {
        try {
            const [_, newChain] = await Chain.update(payload, {
                where: {
                    id,
                },
                returning: true,
            });
            return newChain;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Prepare chain graph to send it to the client side, or even use it inside the services
     * @param {OfferSequence[]} allSequences - All sequences you have
     * @param {OfferSequence} firstSequence - first offer in the chain
     * @returns
     */
    prepareChainGraph(allSequences, firstSequence) {
        try {
            // Filter sequences that are part of this chain by finding connected sequences
            const chainSequences = [];
            const visitedSequences = new Set();
            const sequenceQueue = [firstSequence.id];

            // BFS to find all connected sequences
            while (sequenceQueue.length > 0) {
                const currentSeqId = sequenceQueue.shift();

                if (visitedSequences.has(currentSeqId)) continue;
                visitedSequences.add(currentSeqId);

                const sequence = allSequences.find(
                    (seq) => seq.id === currentSeqId
                );
                if (sequence) {
                    chainSequences.push(sequence);

                    // Find sequences that have this sequence's current_offer as their current_offer
                    const nextSequences = allSequences.filter(
                        (seq) =>
                            seq.currentOfferId === sequence.currentOfferId &&
                            seq.id !== sequence.id
                    );

                    nextSequences.forEach((nextSeq) => {
                        if (!visitedSequences.has(nextSeq.id)) {
                            sequenceQueue.push(nextSeq.id);
                        }
                    });

                    // Also find sequences where next_offer matches any current_offer (for backward compatibility)
                    if (sequence.nextOfferId) {
                        const targetSequences = allSequences.filter(
                            (seq) => seq.currentOfferId === sequence.nextOfferId
                        );

                        targetSequences.forEach((targetSeq) => {
                            if (!visitedSequences.has(targetSeq.id)) {
                                sequenceQueue.push(targetSeq.id);
                            }
                        });
                    }
                }
            }

            // console.log('\n################\n', chainSequences.map((seq) => seq.address), '\n################\n');

            // Build the graph adjacency list
            const offersGraph = {};
            const seenNodeIds = new Set();
            const chainNodes = [];

            // Initialize all offers in the graph and collect unique offers
            chainSequences.forEach((sequence) => {
                const currentOfferId = sequence.currentOfferId.toString?.();
                const nextOfferId = sequence.nextOfferId?.toString?.();

                // Initialize current offer in graph
                if (!offersGraph[currentOfferId]) {
                    offersGraph[currentOfferId] = [];
                }

                // Check if we already have this current offer in chainNodes
                const existingCurrentNode = chainNodes.find(
                    (node) => node.id === currentOfferId
                );

                if (existingCurrentNode) {
                    // Update the existing node if it doesn't have a returnAddress but this sequence does
                    // if (
                    //     !existingCurrentNode.returnAddress &&
                    //     sequence?.address?.address
                    // ) {
                    //     existingCurrentNode.returnAddress =
                    //         sequence?.address?.address;
                    // }
                } else {
                    // Add current offer to nodes if not seen
                    seenNodeIds.add(currentOfferId);
                    // console.log('\n#####  THEIS ###########\n', sequence.returnAddress,'\n################\n');
                    chainNodes.push({
                        id: currentOfferId,
                        title: sequence?.currentOffer?.title,
                        description: sequence?.currentOffer?.description,
                        // returnAddress: sequence?.currentOffer?.returnAddress,
                        // payeeName: sequence?.currentOffer?.payeeName,
                        // printer: sequence?.currentOffer?.printer,
                        // totalAmount: sequence?.currentOffer?.totalAmount,
                        // totalOrders: sequence?.currentOffer?.totalOrders,
                    });
                }

                // DON'T OPEN IT. AND DELETE IT
                // Only process next offer if it exists
                // if (nextOfferId) {
                //     // Check if we already have this next offer in chainNodes
                //     const existingNextNode = chainNodes.find(
                //         (node) => node.id === nextOfferId
                //     );

                // if (existingNextNode) {
                //     // Update the existing node if it doesn't have a returnAddress but this sequence does
                //     if (
                //         !existingNextNode.returnAddress &&
                //         sequence.address.address
                //     ) {
                //         existingNextNode.returnAddress =
                //             sequence.address.address;
                //     }
                // } else {
                //     // Add next offer to nodes if not seen
                //     seenNodeIds.add(nextOfferId);
                //     chainNodes.push({
                //         id: nextOfferId,
                //         title: sequence.nextOffer.title,
                //         description: sequence.nextOffer.description,
                //         returnAddress: sequence.address.address,
                //     });
                // }
                // }
            });

            // Build connections based on sequence relationships
            chainSequences.forEach((sequence) => {
                const currentOfferId = sequence.currentOfferId.toString();

                if (sequence.nextOfferId) {
                    const nextOfferId = sequence.nextOfferId.toString();

                    // Add connection to the graph
                    offersGraph[currentOfferId].push({
                        offerId: nextOfferId,
                        daysToAdd: sequence.daysToAdd,
                    });
                }
            });

            // Determine the first offer from the chain's first sequence
            const firstOfferId = firstSequence.currentOfferId.toString();

            return {
                offers: offersGraph,
                chainNodes,
                firstOffer: firstOfferId,
            };
        } catch (err) {
            throw err;
        }
    }

    // Here it only get them regardless of the order
    async getChainDetails(id) {
        try {
            // const chain = await Chain.findByPk(id);

            // Get all sequences for that chain
            const allSequences = await ChainOffer.findAll({
                where: {
                    chainId: id, // Filter by chain ID to ensure uniqueness
                },
                include: [
                    {
                        model: Offer,
                        as: "offer",
                    },
                ],
            });



            return allSequences;
        } catch (err) {
            throw err;
        }
    }
    

}

export default new ChainServices();
