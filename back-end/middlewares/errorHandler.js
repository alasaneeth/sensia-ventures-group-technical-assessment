import APIError from "../utils/APIError.js";
import prettyError from "../utils/prettyError.js";

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function errorHandler(error, req, res, next) {
    // Log the error for debugging purposes
    console.log(error);
    
    // Use prettyError to format the error response
    const { status, obj } = prettyError(error);
    res.status(status).json(obj);
}

export default errorHandler;