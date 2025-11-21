import { Sequelize, Op } from "sequelize";
import { filtersParser } from "../../../utils/filterParsers.js";
import APIError from "../../../utils/APIError.js";
import Address from "../models/address.js";
import Shipment from "../models/shipment.js";
import CampaignOffer from "../models/campaignOffer.js";

// Load with brand and company for response
import Brand from "../../companies/models/brand.js";
import Company from "../../companies/models/company.js";

class AddressServices {
    async createAddress(addressData) {
        try {
            // Check if address already exists for this brand
            const existingAddress = await Address.findOne({
                where: {
                    address: addressData.address,
                    brandId: addressData.brandId,
                },
            });

            if (existingAddress) {
                throw new APIError(
                    `Address "${addressData.address}" already exists for this brand`,
                    400,
                    "DUPLICATE_ADDRESS"
                );
            }

            const newAddress = await Address.create(addressData);

            const created = await Address.findByPk(newAddress.id, {
                include: [
                    {
                        model: Brand,
                        as: "brand",
                        attributes: ["id", "name", "companyId"],
                        required: false,
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

            return created;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    async getAllAddresses(offset = 0, limit = 10, filters = null, order = null) {
        try {
            let whereClause = {};
            let orderToTake = [["id", "DESC"]];
            if(order !== null && Array.isArray(order)) {
                orderToTake = order;
            }

            if (filters) {
                whereClause = filtersParser(filters);
            }

            // Build include options
            const includeOptions = [
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
            ];

            const { rows: addresses, count: totalCount } =
                await Address.findAndCountAll({
                    attributes: {
                        include: [
                            [
                                Sequelize.literal(`
                                COALESCE( (SELECT COUNT(*) AS count FROM campaign_offers
                                WHERE campaign_offers."returnAddressId" = "Address".id), 0)
                            `),
                                "relatedOffersCount",
                            ],
                            [
                                Sequelize.literal(`
                                COALESCE( (SELECT COUNT(*) AS count FROM shipments
                                WHERE shipments."poBoxId" = "Address".id), 0)
                            `),
                                "relatedShipmentsCount",
                            ],
                            [
                                Sequelize.literal(`
                                (
                                    SELECT MAX("createdAt") FROM shipments
                                    WHERE shipments."poBoxId" = "Address".id
                                )
                            `),
                                "lastShipmentDate",
                            ],
                        ],
                    },
                    include: includeOptions,
                    offset,
                    limit,
                    where: whereClause,
                    order: orderToTake,
                    distinct: true,
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            // Backward compatible shape: expose company at root using brand.company
            addresses.forEach((addr) => {
                const company = addr?.brand?.company || null;
                if (company) {
                    addr.setDataValue("company", company);
                }
            });

            return {
                data: addresses,
                pagination: {
                    total: totalCount,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    async createShipment(data) {
        try {
            // Fetch the address to get the brandId
            const address = await Address.findByPk(data.poBoxId, {
                attributes: ["id", "brandId"],
            });

            if (!address) {
                throw new Error("Address not found");
            }

            // Add brandId to the shipment data
            const shipmentData = {
                ...data,
                brandId: address.brandId,
            };

            const newShipment = await Shipment.create(shipmentData);

            const created = await Shipment.findByPk(newShipment.id, {
                include: [
                    {
                        model: Address,
                        as: "poBox",
                    },
                    {
                        model: Brand,
                        as: "brand",
                        attributes: ["id", "name", "companyId"],
                        required: false,
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

            return created;
        } catch (err) {
            throw err;
        }
    }

    async getShipments(offset = 0, limit = 10, filters = null, order = null) {
        try {
            let whereClause = {};
            let orderToTake = [['id', 'DESC']];

            if(order !== null && Array.isArray(order)) {
                orderToTake = order;
            }

            if (filters) {
                whereClause = filtersParser(filters);
            }

            const { rows: shipments, count: totalCount } =
                await Shipment.findAndCountAll({
                    include: [
                        {
                            model: Address,
                            as: "poBox",
                        },
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
                    offset,
                    limit,
                    where: whereClause,
                    order: orderToTake,
                    distinct: true,
                });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: shipments,
                pagination: {
                    total: totalCount,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }

    async updateShipment(id, data) {
        try {

            const [count] = await Shipment.update(data, { where: { id } });

            if (count === 0) {
                throw new APIError("Shipment not found", 404);
            }

            const updatedShipment = await Shipment.findByPk(id, {
                include: [
                    {
                        model: Address,
                        as: "poBox",
                    },
                    {
                        model: Brand,
                        as: "brand",
                        attributes: ["id", "name", "companyId"],
                        required: false,
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

            return updatedShipment;
        } catch (err) {
            throw err;
        }
    }

    async updateAddress(id, data) {
        try {
            const [_, address] = await Address.update(data, {
                where: { id },
                returning: true,
            });

            return address[0];
        } catch (err) {
            throw err;
        }
    }

    async updateOffersReturnAddress(id, newAddressId) {
        try {
            const [count] = await CampaignOffer.update(
                {
                    returnAddressId: newAddressId,
                },
                { where: { returnAddressId: id } }
            );

            return count;
        } catch (err) {
            throw err;
        }
    }
}

export default new AddressServices();
