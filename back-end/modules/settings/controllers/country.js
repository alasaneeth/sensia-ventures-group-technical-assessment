import countryServices from "../services/country.js";
import APIError from "../../../utils/APIError.js";

class CountryControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addCountry(req, res, next) {
        try {
            const { country, companyId, brandId } = req?.body;

            // Company comes from brand.company; require brandId instead
            if (!brandId) {
                return next(
                    new APIError("Brand is required", 400, "MISSING_BRAND")
                );
            }

            const record = await countryServices.createCountry({
                country,
                brandId, // companyId is ignored
            });

            res.status(200).json({ success: true, data: record });
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
    async getCountries(req, res, next) {
        try {
            const filters = req?.query?.filters;
            const { offset, limit } = req?.pagination;

            const result = await countryServices.getCountries(
                offset,
                limit,
                filters
            );

            return res.status(200).json({
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
    async updateCountry(req, res, next) {
        try {
            const { id } = req?.params;
            const { country, companyId, brandId } = req?.body;

            const updateData = { country };
            if (brandId) {
                updateData.brandId = brandId; // companyId is ignored
            }

            const updatedCountry = await countryServices.updateCountry(id, updateData);

            return res.status(200).json({
                success: true,
                data: updatedCountry,
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
    async deleteCountry(req, res, next) {
        try {
            const { id } = req?.params;

            await countryServices.deleteCountry(id);

            return res.status(200).json({
                success: true,
                message: "Country deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new CountryControllers();