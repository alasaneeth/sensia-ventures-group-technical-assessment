import { filtersParser } from "../utils/filterParsers.js";

export default async function parseFilters(type = "sequelize") {
    return async function (req, res, next) {
        try {
            if(type === 'sequelize') {
            }
        } catch (err) {
            next(err);
        }
    };
}
