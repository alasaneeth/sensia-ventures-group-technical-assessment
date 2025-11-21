import authServices from "../services/auth.js";

import { compare } from "bcryptjs";
import APIError from "../../../utils/APIError.js";
import jwt from "jsonwebtoken";

class AuthControllers {
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async createUser(req, res, next) {
        try {
            const { name, username, password, role, pass } = req?.body;
            if (pass !== "osama123")
                return next(
                    new APIError("Invalid password", 400, "INVALID_PASSWORD")
                );

            const user = await authServices.createUser(
                name,
                username,
                role,
                password
            );

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     *  This will recieve the token and we should return the new client data
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getSession(req, res, next) {
        try {
            // In routes there is an isAuthenticated middlware meaning here we can return the user
            return res.status(200).json({
                success: true,
                message: "Session Retrieved successfully",
                data: req.user,
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
    async login(req, res, next) {
        try {
            const { username, password } = req.body;

            if (!username || !password)
                return next(
                    new APIError(
                        "Username and password are required",
                        400,
                        "REQUIRED_FIELDS"
                    )
                );


            const user = await authServices.getUserBy("username", username);

            const isCorrect = await compare(
                password,
                user?.dataValues.password
            );

            if (!isCorrect)
                return next(
                    new APIError(
                        "The provided username or password is incorrect",
                        401,
                        "INCORRECT_CREDENTIALS"
                    )
                );

            // For now only access token
            const accessToken = jwt.sign(
                { id: user.dataValues.id },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );

            return res.status(200).json({
                success: true,
                message: "Login successfully",
                data: {
                    accessToken,
                    user,
                },
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
    async logout(req, res, next) {
        try {
            // Very simple now just return success true and in the client side delete the access token :)
            return res.status(200).json({
                success: true,
                message: "Logout successfully",
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new AuthControllers();
