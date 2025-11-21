import PaymentMethod from "../models/paymentMethod.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import APIError from "../../../utils/APIError.js";
import  Company  from "../../companies/models/company.js";
import  Brand  from "../../companies/models/brand.js";
import { Op } from "sequelize";

class PaymentMethodServices {
    /**

     * @param {Object} filters - Filters for the query
     * @returns {Promise<Object>} - Payment methods with pagination info
     */
    async getAllPaymentMethods( filters = null) {
        try {
            let whereClause = {};

            if (filters) {
                whereClause = filtersParser(filters);
            }

            const { rows: paymentMethods, count: totalCount } =
                await PaymentMethod.findAndCountAll({
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
                    where: whereClause,
                    order: [["country", "ASC"]],
                    distinct: true,
                });

            return {
                data: paymentMethods,
                pagination: {
                    total: totalCount,
                    page: 1,
                    pages: 1,
                    limit: totalCount,
                },
            };
        } catch (error) {
            console.error("Error getting payment methods:", error);
            throw error;
        }
    }

    /**
     * Create a new payment method
     * @param {Object} paymentMethodData - Payment method data
     * @param {string} paymentMethodData.country - Country
     * @param {Array<string>} paymentMethodData.paymentMethod - Array of payment methods (e.g., ['cash', 'check', 'postal'])
     * @returns {Promise<Object>} - Created payment method
     */
    async createPaymentMethod(paymentMethodData) {
        try {
            // Check if payment method already exists for this country and brand
            const existingMethod = await PaymentMethod.findOne({
                where: {
                    country: paymentMethodData.country.toLowerCase(),
                    brandId: paymentMethodData.brandId,
                },
            });

            if (existingMethod) {
                // Update existing payment method
                await existingMethod.update({
                    paymentMethod: Array.isArray(paymentMethodData.paymentMethod)
                        ? paymentMethodData.paymentMethod
                        : [paymentMethodData.paymentMethod],
                });
                const updated = await PaymentMethod.findByPk(existingMethod.id, {
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
                return updated;
            }

            // Create new payment method
            const paymentMethod = await PaymentMethod.create({
                country: paymentMethodData.country.toLowerCase(),
                paymentMethod: Array.isArray(paymentMethodData.paymentMethod)
                    ? paymentMethodData.paymentMethod
                    : [paymentMethodData.paymentMethod],
                brandId: paymentMethodData.brandId,
            });

            const created = await PaymentMethod.findByPk(paymentMethod.id, {
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

            return created;
        } catch (error) {
            console.error("Error creating payment method:", error);
            throw error;
        }
    }

    /**
     * Update an existing payment method
     * @param {number} id - Payment method ID
     * @param {Object} paymentMethodData - Payment method data
     * @returns {Promise<Object>} - Updated payment method
     */
    async updatePaymentMethod(id, paymentMethodData) {
        try {

            const paymentMethod = await PaymentMethod.findByPk(id);

            if (!paymentMethod) {
                throw new APIError(
                    "Payment method not found",
                    404,
                    "PAYMENT_METHOD_NOT_FOUND"
                );
            }

            // Update payment method
            await paymentMethod.update({
                country: paymentMethodData.country
                    ? paymentMethodData.country.toLowerCase()
                    : paymentMethod.country,
                paymentMethod: paymentMethodData.paymentMethod
                    ? (Array.isArray(paymentMethodData.paymentMethod)
                        ? paymentMethodData.paymentMethod
                        : [paymentMethodData.paymentMethod])
                    : paymentMethod.paymentMethod,
                brandId: paymentMethodData.brandId ?? paymentMethod.brandId,
            });

            const updatedPaymentMethod = await PaymentMethod.findByPk(id, {
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

            return updatedPaymentMethod;
        } catch (error) {
            console.error("Error updating payment method:", error);
            throw error;
        }
    }

    /**
     * Get payment method by country
     * @param {string} country - Country code
     * @returns {Promise<Object>} - Payment method
     */
    async getPaymentMethodByCountry(country) {
        try {
            const paymentMethod = await PaymentMethod.findOne({
                where: {
                    country: country.toLowerCase(),
                },
            });

            if (!paymentMethod) {
                throw new APIError(
                    "Payment method not found",
                    404,
                    "PAYMENT_METHOD_NOT_FOUND"
                );
            }

            return paymentMethod;
        } catch (error) {
            console.error("Error getting payment method by country:", error);
            throw error;
        }
    }
}

export default new PaymentMethodServices();
