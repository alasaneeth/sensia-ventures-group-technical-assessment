import APIError from "../../../utils/APIError.js";
import accountingServices from "../services/accounting.js";

class AccountingControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addInvoice(req, res, next) {
        try {
            const { partner, subject, code, price, currency, createdAt, companyId, brandId } =
                req.body;

            // Validate required fields
            if (!brandId) {
                return next(
                    new APIError("Brand is required", 400, "MISSING_BRAND")
                );
            }

            const invoice = await accountingServices.createInvoice({
                partner,
                subject,
                code,
                price,
                currency,
                createdAt,
                brandId, // companyId is ignored
            });

            return res.status(200).json({
                success: true,
                data: invoice,
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
    async addPayment(req, res, next) {
        try {
            const { partner, amount, currency, createdAt, companyId, brandId } = req.body;

            if (!brandId) {
                return next(
                    new APIError("Brand is required", 400, "MISSING_BRAND")
                );
            }

            const payment = await accountingServices.createPayment({
                partner,
                amount,
                currency,
                createdAt,
                brandId, // companyId is ignored
            });

            return res.status(200).json({
                success: true,
                data: payment,
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
    async editInvoice(req, res, next) {
        try {
            const { id } = req?.params;
            const { data } = req?.body;

            const result = await accountingServices.editInvoice(id, data);

            res.status(200).json({
                success: true,
                data: result,
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
    async editPayment(req, res, next) {
        try {
            const { id } = req?.params;
            const { data } = req?.body;

            const result = await accountingServices.editPayment(id, data);

            return res.status(200).json({
                success: true,
                data: result,
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
    async getInvoices(req, res, next) {
        try {
            const { offset, limit } = req.pagination;
            let filters = null;
            if (req.query.filters) {
                // Handle both string and object cases
                filters = typeof req.query.filters === 'string' 
                    ? JSON.parse(req.query.filters) 
                    : req.query.filters;
            }

            const data = await accountingServices.getInvoices(offset, limit, filters);

            return res.status(200).json({
                success: true,
                data: data.data,
                pagination: data.pagination,
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
    async getPayments(req, res, next) {
        try {
            const { offset, limit } = req.pagination;
            let {filters} = req.query;
            console.log('\n######## see ########\n', filters,'\n################\n');

            const data = await accountingServices.getPayments(offset, limit, filters);

            return res.status(200).json({
                success: true,
                data: data.data,
                pagination: data.pagination,
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
    async getSummary(req, res, next) {
        try {
            const { offset, limit } = req.pagination;
            const filters = req?.query?.filters;

            console.log('\n################\n', filters,'\n################\n');

            const result = await accountingServices.getSummary(offset, limit, filters);

            return res.status(200).json({
                success: true,
                ...result,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new AccountingControllers();
