import APIError from "../../../utils/APIError.js";
import User from "../models/user.js";

class AuthServices {
    async getUserBy(by, value) {
        try {
            const whereClause = {};

            if (by === "username") {
                whereClause.username = value;
            } else if (by === "id") {
                whereClause.id = value;
            } else {
                throw new Error(`Invalid by parameter: ${by}`);
            }

            const user = await User.findOne({ where: whereClause });
            if (user) return user;

            throw new APIError(
                `There is no user with ${by} ${value}`,
                404,
                "USER_NOT_FOUND"
            );
        } catch (err) {
            throw err;
        }
    }

    async createUser(name, username, role, password) {
        try {
            const user = User.create({ name, username, role, password });
            return user;
        } catch (err) {
            throw err;
        }
    }

    // TEMP till we add admin dashboard
}

// TODO: When expose an endpoint for creaing accounts remove this
if (import.meta.url === `file://${process.argv[1]}`) {
    (async function () {
        // Take the password and username form the terminal
        const name = process.argv[2];
        const username = process.argv[3];
        const password = process.argv[4];
        const role = process.argv[5];
        const req = await fetch("http://localhost:4000/api/auth/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                username,
                password,
                role,
                pass: "osama123",
            }),
        });
        const res = await req.json();
        console.log(res);
    })();
}

export default new AuthServices();
