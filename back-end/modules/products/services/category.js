import APIError from "../../../utils/APIError.js";
import { filtersParser } from "../../../utils/filterParsers.js";
import Brand from "../../companies/models/brand.js";
import Category from "../models/category.js";
import Company from "../../companies/models/company.js";

class CategoryServices {
    async addCategory(data) {
        try {
            // Check for that brand
            const brand = await Brand.findByPk(data.brandId);
            if (!brand)
                throw new APIError(
                    "The provided brand isn't found in the database",
                    400,
                    "BRAND_NOT_EXISTS"
                );

            const category = await Category.create(data);
            return category;
        } catch (error) {
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            const deletedCounts = await Category.destroy({
                where: { id },
            });

            if (!deletedCounts)
                throw new APIError(
                    "The category is either deleted or not found",
                    404,
                    "NOT_FOUND"
                );

            return deletedCounts;
        } catch (err) {
            throw err;
        }
    }

    async updateCategory(id, data) {
        try {
            const [, [cateogry]] = await Category.update(data, {
                where: id,
                returning: true,
            });

            if (!cateogry)
                throw new APIError(
                    "The category you are looking for isn't exists",
                    404,
                    "NOT_FOUND"
                );

            return cateogry;
        } catch (err) {
            throw err;
        }
    }

    async getCategories(offset = 0, limit = 10, filters = null, sortField = null, sortDirection = "ASC") {
        let whereClause = {};

        if(filters){
            whereClause = filtersParser(filters);
        }

        try {
            // Determine order clause
            const orderClause = sortField
                ? [[sortField, sortDirection.toUpperCase()]]
                : [["id", "DESC"]];

            const { count, rows } = await Category.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Brand,
                        as: "brand",
                        include: [
                            {
                                model: Company,
                                as: "company",
                            },
                        ],
                    },
                ],
                offset,
                distinct: true,
                limit,
                order: orderClause,
            });

            // Calculate pagination info
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);

            return {
                categories: rows,
                pagination: {
                    total: count,
                    pages: totalPages,
                    page: currentPage,
                    limit,
                },
            };
        } catch (err) {
            throw err;
        }
    }
}

export default new CategoryServices();