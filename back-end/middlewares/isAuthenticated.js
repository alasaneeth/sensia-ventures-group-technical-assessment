import APIError from "../utils/APIError.js";
import jwt from "jsonwebtoken";
import authServices from "../modules/auth/services/auth.js";

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export default async function isAuthenticated(req, res, next) {
    try {
        const token = req?.headers?.authorization?.split(" ")[1];
        if (!token) {
            return next(new APIError("Unauthorized", 401, "UNAUTHORIZED"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await authServices.getUserBy("id", decoded.id);
        if (!user) {
            return next(new APIError("User not found", 404, "USER_NOT_FOUND"));
        }

        // attach the user in case needed later
        req.user = user;
        next();
    } catch (err) {
        if (
            err instanceof jwt.TokenExpiredError ||
            err instanceof jwt.JsonWebTokenError
        ) {
            next(new APIError("Token expired", 401, "EXPIRED_TOKEN"));
        } else if (err instanceof jwt.JsonWebTokenError) {
            next(new APIError("Invalid token", 401, "INVALID_TOKEN"));
        } else {
            next(err);
        }
    }
}
