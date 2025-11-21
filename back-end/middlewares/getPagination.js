/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export default async function getPagination(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const rowsPerPage = parseInt(req.query.rows_per_page) || 10;

        // Validate pagination parameters
        if (page < 1 || rowsPerPage < 1) {
            throw new APIError(
                "Invalid pagination parameters",
                400,
                "INVALID_PAGINATION"
            );
        }

        // Calculate offset and limit for database query
        const offset = (page - 1) * rowsPerPage;
        const limit = Math.min(rowsPerPage, 200);

        req.pagination = {
            offset,
            limit,
        };

        next();
    } catch (err) {
        next(err);
    }
}
