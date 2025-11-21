import APIError from "../../../utils/APIError.js";
import chainServices from "../services/chain.js";

class ChainControllers {
    /**
     * Add a new offer chain
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addChain(req, res, next) {
        try {
            // Extract data from request body
            const { title, offers, firstOffer, offerReturnAddresses, companyId, brandId } =
                req.body;

            // Validate required fields
            if (!title) {
                throw new APIError(
                    "Chain title is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            // Company comes from brand.company; require brandId instead
            if (!brandId) {
                throw new APIError(
                    "Brand is required",
                    400,
                    "MISSING_REQUIRED_FIELD"
                );
            }

            if (
                !offers ||
                typeof offers !== "object" ||
                Object.keys(offers).length === 0
            ) {
                throw new APIError(
                    "Offers graph is required and must be a non-empty object",
                    400,
                    "INVALID_OFFERS"
                );
            }

            if (!firstOffer) {
                throw new APIError(
                    "First offer ID is required",
                    400,
                    "MISSING_FIRST_OFFER"
                );
            }

            // Validate offerReturnAddresses
            // if (!offerReturnAddresses || !Array.isArray(offerReturnAddresses) || offerReturnAddresses.length === 0) {
            //     throw new APIError('Return addresses for offers are required', 400, 'MISSING_RETURN_ADDRESSES');
            // }

            // Check that each offer has a return address
            // for (const offerReturnAddress of offerReturnAddresses) {
            //     if (!offerReturnAddress.offerId || !offerReturnAddress.returnAddress) {
            //         throw new APIError('Each offer must have an offerId and returnAddress', 400, 'INVALID_RETURN_ADDRESS_STRUCTURE');
            //     }
            // }

            // Validate offers graph structure
            for (const [offerId, connections] of Object.entries(offers)) {
                if (!Array.isArray(connections)) {
                    throw new APIError(
                        `Connections for offer ${offerId} must be an array`,
                        400,
                        "INVALID_OFFER_STRUCTURE"
                    );
                }

                for (const connection of connections) {
                    if (
                        !connection ||
                        typeof connection !== "object" ||
                        !connection.offerId ||
                        connection.daysToAdd === undefined ||
                        isNaN(connection.daysToAdd)
                    ) {
                        throw new APIError(
                            "Each connection must have offerId and daysToAdd properties",
                            400,
                            "INVALID_CONNECTION_STRUCTURE"
                        );
                    }
                }
            }

            // Pass data to service layer to create the chain
            const chainId = await chainServices.createChain(
                title,
                offers,
                firstOffer,
                offerReturnAddresses,
                undefined, // companyId ignored
                brandId
            );

            // Return success response with the chain ID
            res.status(201).json({
                success: true,
                data: { id: chainId },
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
    async deleteChain(req, res, next) {
        try {
            const { id } = req?.params;

            await chainServices.deleteChain(id);

            return res.status(200).json({
                success: true,
                message: "Chain deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get a specific chain with all its offer sequences
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getChainById(req, res, next) {
        try {
            // Extract chain ID from params
            const chainId = parseInt(req.params.id);

            if (!chainId || isNaN(chainId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid chain ID",
                });
            }

            // Call the service function
            const result = await chainServices.getChainById(chainId);

            // Return the response to the client
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (err) {
            console.error("Error in getChainById controller:", err);
            next(err);
        }
    }

    /**
     * Get chains with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getChains(req, res, next) {
        try {
            // Extract pagination parameters from query
            const page = parseInt(req.query.page) || 1;
            const rowsPerPage = parseInt(req.query.rows_per_page) || 10;
            const filters = req?.query?.filters;

            const offset = (page - 1) * rowsPerPage;
            const maxLimit = Math.min(rowsPerPage, 200);

            // Call the service function
            const result = await chainServices.getChains(
                offset,
                maxLimit,
                filters
            );

            // Return the response to the client
            return res.status(200).json(result);
        } catch (err) {
            console.error("Error in getChains controller:", err);
            next(err);
        }
    }

    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateChain(req, res, next) {
        try {
            const { payload } = req?.body;
            const { id } = req?.params;

            const newChain = await chainServices.updateChain(id, payload);

            return res.status(200).json({
                success: true,
                data: newChain,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * ----> This is not used now <----
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getChainsOffers(req, res, next) {
        try {
            const { id } = req?.params;

            const chain = await chainServices.getChainDetails(id);

            return res.status(200).json({
                success: true,
                data: chain,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new ChainControllers();
