import APIError from "../../../utils/APIError.js";
import categoryServices from "../services/category.js";

class CategoryControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async addCategory(req, res, next) {
        try {
            const { brandId, name } = req?.body;
            if (!brandId) {
                return next(
                    new APIError("Brand is required", 400, "MISSING_DATA")
                );
            }

            const category = await categoryServices.addCategory({
                brandId,
                name,
            });

            /*

            */

            res.status(201).json({
                success: true,
                data: category,
                message: "Category created successfully",
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
    async updateCategory(req, res, next) {
        try {
            const {id} = req?.params;
            const {data} = req?.body;

            const updatedCategory = await categoryServices.updateCategory(id, data);

            res.status(200).json({
                success: true,
                data: updatedCategory,
                message: "Category updated successfully",
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
    async getCategories(req, res, next) {
        try {
            const {offset, limit} = req?.pagination;
            const {filters } = req?.query;
            
            // Extract sorting parameters
            const sortField = req.query.sortField;
            const sortDirection = req.query.sortDirection || "ASC";

            const result = await categoryServices.getCategories(offset, limit, filters, sortField, sortDirection);

            res.status(200).json({
                success: true,
                data: result.categories,
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
    async deleteCategory(req, res, next) {
        try {
            const {id} = req?.params;
            
            if(!id) {
                return next(new APIError("Invalid category ID", 400, "INVALID_CATEGORY_ID"));
            }

            const deletedCategory = await categoryServices.deleteCategory(id);

            res.status(200).json({
                success: true,
                data: deletedCategory,
                message: "Category deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new CategoryControllers();