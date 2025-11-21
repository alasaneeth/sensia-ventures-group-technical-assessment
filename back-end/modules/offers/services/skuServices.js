import Sku from "../../products/models/sku.js";

export async function createSku(title, description, price, currency) {
    try {
        const sku = await Sku.create({ title, description, price, currency });
        return sku;
    } catch (err) {
        throw err;
    }
}

export async function getSkus(offset = 0, limit = 10) {
    try {
        const data = await Sku.findAll({
            offset,
            limit,
            order: [["id", "DESC"]],
        });
        const totalCount = await Sku.count();

        // Calculate pagination info
        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(totalCount / limit);

        return {
            data,
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
