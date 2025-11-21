import APIError from "../utils/APIError.js";

// Map HTTP methods to permission actions
const METHOD_TO_ACTION = {
    GET: "view",
    POST: "create",
    PUT: "edit",
    PATCH: "edit",
    DELETE: "delete",
};

// Super admin role ID - always bypass permission checks
const SUPERADMIN_ROLE = 99;

/**
 * Middleware factory that creates a middleware to check if the user has the required permission
 * @param {string} section - The section key (e.g., "campaigns", "offers", "orders")
 * @param {string|null} action - Optional action override (create, view, edit, delete)
 *                              If null, will be determined from HTTP method
 * @returns {Function} Express middleware
 */
export default function checkPermission(section, action = null) {
    return async (req, res, next) => {
        try {
            // req.user is set by the isAuthenticated middleware
            // req.user.permissions is set by the loadPermissions middleware
            if (!req.user) {
                return next(new APIError("Unauthorized", 401, "UNAUTHORIZED"));
            }

            // Super admin bypass - always allow
            if (req.user.role === SUPERADMIN_ROLE) {
                return next();
            }

            // Get user's permissions
            const permissions = req.user.permissions || {};

            // Determine action from HTTP method if not provided
            const requiredAction = action || METHOD_TO_ACTION[req.method];

            if (!requiredAction) {
                return next(
                    new APIError(
                        "Unable to determine required action for this request",
                        400,
                        "INVALID_REQUEST_METHOD"
                    )
                );
            }

            // Get section permissions
            const sectionPermissions = permissions[section];

            // If section not found in permissions, deny access
            if (!sectionPermissions) {
                return next(
                    new APIError(
                        `Access denied: No permissions configured for section "${section}"`,
                        403,
                        "FORBIDDEN"
                    )
                );
            }

            // Check if user has the required action permission
            const hasPermission = sectionPermissions[requiredAction] === true;

            if (!hasPermission) {
                return next(
                    new APIError(
                        `Access denied: Insufficient permissions to ${requiredAction} ${section}`,
                        403,
                        "FORBIDDEN"
                    )
                );
            }

            // User has the required permission, proceed to the next middleware/route handler
            next();
        } catch (err) {
            next(new APIError("Permission check error", 500, "PERMISSION_CHECK_ERROR"));
        }
    };
}

/**
 * Check multiple permissions (user needs ALL of them)
 * @param {Array<{section: string, action?: string}>} permissionChecks - Array of permission checks
 * @returns {Function} Express middleware
 */
export function checkMultiplePermissions(permissionChecks) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new APIError("Unauthorized", 401, "UNAUTHORIZED"));
            }

            // Super admin bypass
            if (req.user.role === SUPERADMIN_ROLE) {
                return next();
            }

            const permissions = req.user.permissions || {};

            // Check all permissions
            for (const check of permissionChecks) {
                const section = check.section;
                const action = check.action || METHOD_TO_ACTION[req.method];

                const sectionPermissions = permissions[section];
                if (!sectionPermissions || sectionPermissions[action] !== true) {
                    return next(
                        new APIError(
                            `Access denied: Insufficient permissions for ${action} ${section}`,
                            403,
                            "FORBIDDEN"
                        )
                    );
                }
            }

            next();
        } catch (err) {
            next(new APIError("Permission check error", 500, "PERMISSION_CHECK_ERROR"));
        }
    };
}

/**
 * Check any of multiple permissions (user needs AT LEAST ONE)
 * @param {Array<{section: string, action?: string}>} permissionChecks - Array of permission checks
 * @returns {Function} Express middleware
 */
export function checkAnyPermission(permissionChecks) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new APIError("Unauthorized", 401, "UNAUTHORIZED"));
            }

            // Super admin bypass
            if (req.user.role === SUPERADMIN_ROLE) {
                return next();
            }

            const permissions = req.user.permissions || {};

            // Check if user has at least one permission
            for (const check of permissionChecks) {
                const section = check.section;
                const action = check.action || METHOD_TO_ACTION[req.method];

                const sectionPermissions = permissions[section];
                if (sectionPermissions && sectionPermissions[action] === true) {
                    return next(); // User has at least one permission
                }
            }

            // User doesn't have any of the required permissions
            return next(
                new APIError(
                    "Access denied: Insufficient permissions",
                    403,
                    "FORBIDDEN"
                )
            );
        } catch (err) {
            next(new APIError("Permission check error", 500, "PERMISSION_CHECK_ERROR"));
        }
    };
}

