import APIError from "../../../utils/APIError.js";
import paymentMethodServices from "../services/paymentMethod.js";


class PaymentMethodControllers {
    /**
     * Add a new payment method
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addPaymentMethod(req, res, next) {
        try {
            const { country, paymentMethod, companyId, brandId } = req?.body || {};

            if (!country) {
                return next(
                    new APIError("Country is required", 400, "MISSING_COUNTRY")
                );
            }

            if (!paymentMethod) {
                return next(
                    new APIError(
                        "Payment method is required",
                        400,
                        "MISSING_PAYMENT_METHOD"
                    )
                );
            }

            if (!brandId) {
                return next(
                    new APIError("Brand is required", 400, "MISSING_BRAND")
                );
            }

            const createdPaymentMethod = await paymentMethodServices.createPaymentMethod({
                country,
                paymentMethod,
                brandId, // companyId is ignored
            });

            res.status(201).json({
                success: true,
                data: createdPaymentMethod,
                message: "Payment method created successfully",
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
    async getPaymentMethodByCountry(req, res, next) {
        try {
            const country = req?.params?.country?.toLowerCase();

            if (!country) {
                throw new APIError(
                    "Country parameter is required",
                    400,
                    "MISSING_COUNTRY"
                );
            }

            const paymentMethod = await paymentMethodServices.getPaymentMethodByCountry(
                country
            );

            return res.status(200).json({
                success: true,
                data: paymentMethod,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get all payment methods with pagination
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getPaymentMethods(req, res, next) {
        try {
            let {filters} = req?.query;

            const result = await paymentMethodServices.getAllPaymentMethods(filters);

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
     * Update an existing payment method
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async updatePaymentMethod(req, res, next) {
        try {
            const { id } = req?.params;
            const { country, paymentMethod, companyId, brandId } = req?.body;

            if (!id) {
                return next(
                    new APIError(
                        "Payment method ID is required",
                        400,
                        "MISSING_ID"
                    )
                );
            }

            const updatedPaymentMethod = await paymentMethodServices.updatePaymentMethod(id, {
                country,
                paymentMethod,
                brandId, // companyId is ignored
            });

            return res.status(200).json({
                success: true,
                data: updatedPaymentMethod,
                message: "Payment method updated successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new PaymentMethodControllers();