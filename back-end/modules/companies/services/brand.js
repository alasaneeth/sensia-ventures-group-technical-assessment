import APIError from "../../../utils/APIError.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import Brand from "../models/brand.js";

class BrandServices {
    async createBrand(companyId, name, description = null) {
        try {
            const brand = await Brand.create({ companyId, name, description });

            return brand;
        } catch (error) {
            throw error;
        }
    }

    async getBrandById(id) {
        try {
            const brand = await Brand.findByPk(id);

            if (!brand) {
                throw new APIError("Brand not found", 404, "BRAND_NOT_FOUND");
            }

            return brand;
        } catch (error) {
            throw error;
        }
    }

    async getBrandsByCompanyId(companyId, offset = 0, limit = 10, filters = null) {
        let whereClause = { companyId };
        if (filters) {
            whereClause = { 
                companyId,
                ...filtersParser(filters) 
            };
        }

        try {
            const { rows: brands, count: totalCount } =
                await Brand.findAndCountAll({
                    where: whereClause,
                    limit,
                    offset,
                    order: [["id", "DESC"]],
                });

            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: brands,
                pagination: {
                    total: totalCount,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    async updateBrand(id, payload) {
        try {
            const [_, updatedBrands] = await Brand.update(payload, {
                where: { id },
                returning: true,
            });

            if (!updatedBrands || updatedBrands.length === 0) {
                throw new APIError(
                    "Brand not found",
                    404,
                    "BRAND_NOT_FOUND"
                );
            }

            return updatedBrands[0];
        } catch (err) {
            throw err;
        }
    }

    async deleteBrand(id) {
        try {
            const isDeleted = await Brand.destroy({
                where: { id },
            });

            if (!isDeleted) {
                throw new APIError(
                    "Failed to delete brand or it's already deleted",
                    404
                );
            }

            return isDeleted;
        } catch (err) {
            throw err;
        }
    }
}

export default new BrandServices();

