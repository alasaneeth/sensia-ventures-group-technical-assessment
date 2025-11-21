import APIError from "../utils/APIError.js";

/**
 * Middleware factory that creates a middleware to check if the user has the required role
 * @param {number|number[]} requiredRoles - The role(s) required to access the route
 * @returns {Function} Express middleware
 */
export default function isAuthorized(requiredRoles) {
    return async (req, res, next) => {
        try {
            // req.user is set by the isAuthenticated middleware
            if (!req.user) {
                return next(new APIError("Unauthorized", 401, "UNAUTHORIZED"));
            }

            const userRole = req.user.role;
            console.log("%%% ", requiredRoles, ' %%%%')
            
            // Check if requiredRoles is an array or a single value
            if (Array.isArray(requiredRoles)) {
                // Check if user's role is in the array of required roles
                if (!requiredRoles.includes(userRole)) {
                    console.log('\n########', userRole ,' ########\n', requiredRoles,'\n################\n');
                    return next(new APIError("Forbidden: Insufficient permissions", 403, "FORBIDDEN"));
                }
            } else {
                // Check if user's role matches the required role
                if (userRole !== requiredRoles) {
                    console.log('\n########', userRole ,' ########\n', requiredRoles,'\n################\n');
                    return next(new APIError("Forbidden: Insufficient permissions", 403, "FORBIDDEN"));
                }
            }

            // User has the required role, proceed to the next middleware/route handler
            next();
        } catch (err) {
            next(new APIError("Authorization error", 500, "AUTHORIZATION_ERROR"));
        }
    };
}