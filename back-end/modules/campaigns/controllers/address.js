import APIError from "../../../utils/APIError.js";
import addressServices from "../../campaigns/services/address.js";

class AddressControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updateAddress(req, res, next) {
        try {
            const { id } = req?.params;
            const { data } = req?.body;

            const newAddress = await addressServices.updateAddress(id, data);

            return res.status(200).json({
                success: true,
                data: newAddress,
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
    async addAddress(req, res, next) {
        try {
            const { data } = req?.body || {};

            // TODO: use some library for types like zod

            if (data?.address === null)
                return next(
                    new APIError("Address is required", 400, "MISSING_ADDRESS")
                );

            if (!data?.brandId)
                return next(
                    new APIError("Brand is required", 400, "MISSING_BRAND")
                );

            const createdAddress = await addressServices.createAddress(data);

            res.status(200).json({
                success: true,
                data: createdAddress,
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
    async addShipment(req, res, next) {
        try {
            const { data } = req?.body;
            // The id of the PO-Box
            const { id } = req?.params;

            const shipment = await addressServices.createShipment({
                poBoxId: id,
                ...data,
            });

            return res.status(200).json({
                success: true,
                data: shipment,
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
    async getAddresses(req, res, next) {
        try {
            const filters = req?.query?.filters;
            const { offset, limit } = req?.pagination;
            // order must be of this shape [['field', direction]]
            const order = req?.query?.order;

            const result = await addressServices.getAllAddresses(
                offset,
                limit,
                filters,
                order
            );

            res.status(200).json({
                success: true,
                data: result.data,
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
    async getShipments(req, res, next) {
        try {
            let { filters, order } = req?.query;

            const { offset, limit } = req?.pagination;

            const result = await addressServices.getShipments(
                offset,
                limit,
                filters,
                order
            );

            return res.status(200).json({
                success: true,
                pagination: result.pagination,
                data: result.data,
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
    async updateShipment(req, res, next) {
        try {
            // Id of the shipment
            const { id } = req?.params;
            const { data } = req?.body;

            // Extract companyId from data if present (ignore it)
            const { companyId, ...updateData } = data || {};

            const updatedShipment = await addressServices.updateShipment(
                id,
                updateData
            );

            return res.status(200).json({
                success: true,
                data: updatedShipment,
                message: "Update Done",
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
    async updateOffersAddresses(req, res, next) {
        try {
            // The original address id
            const { id } = req?.params;

            // The new return address
            const {
                data: { newAddressId },
            } = req?.body;

            await addressServices.updateOffersReturnAddress(id, newAddressId);

            return res.status(200).json({
                success: true,
                message: "Updated successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new AddressControllers();
