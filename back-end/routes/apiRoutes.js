import { Router } from "express";
import campaignsRoutes from "../modules/campaigns/routes/campaign.js";
import offersRoutes from "../modules/offers/routes/offersRoutes.js";
import chainsRoutes from "../modules/offers/routes/chainsRoutes.js";
import clientsRoutes from "../modules/clients/routes/client.js";
import orderRoutes from "../modules/orders/routes/orderRoutes.js";
import addressesRoutes from "../modules/campaigns/routes/address.js";
import payeenameRoutes from "../modules/settings/routes/payeeName.js";
import commentsRoutes from "../modules/clients/routes/comment.js";
import authRoutes from "../modules/auth/routes/routes.js";
import accountingRoutes from "../modules/accounting/routes/accounting.js";
import devCommentsRoutes from "../modules/settings/routes/devComment.js";
import countriesRoutes from "../modules/settings/routes/country.js";
import paymentMethodsRoutes from "../modules/settings/routes/paymentMethod.js";
import companyRoutes from "../modules/companies/routes/company.js"
import brandRoutes from "../modules/companies/routes/brand.js"
import categoriesRoutes from "../modules/products/routes/category.js";
import productsRoutes from "../modules/products/routes/productRoutes.js";
import productVariationRoutes from "../modules/products/routes/productVariation.js";
import skuRoutes from "../modules/products/routes/sku.js";
import bundleSkuRoutes from "../modules/products/routes/bundleSku.js";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import isAuthorized from "../middlewares/isAuthorized.js";

const routes = Router();

// Define role constants for better readability
const ROLES = {
    USER: 0,
    ADMIN: 1,
    PRINTER: 2,
    DATA_ENTRY: 3,
    SUPERADMIN: 99,
};

// Auth routes are accessible without authentication
routes.use("/api/auth", authRoutes);

// Apply authentication middleware to all other routes
routes.use("/api", isAuthenticated);

// Load permissions for authenticated users (after authentication)
// This attaches req.user.permissions for permission-based checks
// routes.use("/api", loadPermissions);

// Routes for ADMIN role (role 1) - has access to everything
// Admin can access all routes without additional restrictions

// Routes for DATA ENTRY role (role 3)
// Data entry can access clients, campaigns, offers, and orders
routes.use(
    "/api/companies",
    isAuthorized([
        ROLES.ADMIN,
        ROLES.DATA_ENTRY,
        ROLES.SUPERADMIN,
        ROLES.PRINTER,
        ROLES.ADMIN,
    ]),
    companyRoutes
);

routes.use(
    "/api/brands",
    isAuthorized([
        ROLES.ADMIN,
        ROLES.DATA_ENTRY,
        ROLES.PRINTER,
        ROLES.SUPERADMIN,
    ]),
    brandRoutes
);

routes.use(
    "/api/clients",
    isAuthorized([ROLES.ADMIN, ROLES.DATA_ENTRY, ROLES.SUPERADMIN]),
    clientsRoutes
);
routes.use(
    "/api/campaigns",
    isAuthorized([ROLES.ADMIN, ROLES.DATA_ENTRY, ROLES.SUPERADMIN]),
    campaignsRoutes
);
routes.use(
    "/api/payment-methods",
    isAuthorized([ROLES.ADMIN, ROLES.DATA_ENTRY, ROLES.SUPERADMIN]),
    paymentMethodsRoutes
);
routes.use(
    "/api/offers/chains",
    isAuthorized([ROLES.ADMIN, ROLES.DATA_ENTRY, ROLES.SUPERADMIN]),
    chainsRoutes
);

routes.use(
    "/api/offers",
    isAuthorized([
        ROLES.ADMIN,
        ROLES.DATA_ENTRY,
        ROLES.PRINTER,
        ROLES.SUPERADMIN,
    ]),
    offersRoutes
);
// routes.use('/api/offers', isAuthorized([ROLES.ADMIN, ROLES.DATA_ENTRY, ROLES.PRINTER]), chainsRoutes);

routes.use(
    "/api/orders",
    isAuthorized([ROLES.ADMIN, ROLES.DATA_ENTRY, ROLES.SUPERADMIN]),
    orderRoutes
);

// Routes for PRINTER role (role 2)
// Printer can access offers only
// Note: Printer is already included in the offers route above

// Admin-only routes
routes.use(
    "/api/dev-comments",
    isAuthorized([
        ROLES.ADMIN,
        ROLES.DATA_ENTRY,
        ROLES.PRINTER,
        ROLES.SUPERADMIN,
    ]),
    devCommentsRoutes
);
routes.use(
    "/api/accounting",
    isAuthorized([ROLES.ADMIN, ROLES.SUPERADMIN]),
    accountingRoutes
);

routes.use(
    "/api/addresses",
    isAuthorized([ROLES.ADMIN, ROLES.SUPERADMIN]),
    addressesRoutes
);
routes.use(
    "/api/payeenames",
    isAuthorized([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DATA_ENTRY]),
    payeenameRoutes
);
routes.use(
    "/api/comments",
    isAuthorized([ROLES.ADMIN, ROLES.DATA_ENTRY, ROLES.SUPERADMIN]),
    commentsRoutes
);

routes.use("/api/countries", countriesRoutes);

routes.use("/api/categories", isAuthorized([ROLES.ADMIN, ROLES.SUPERADMIN]), categoriesRoutes);

routes.use("/api/products", isAuthorized([ROLES.ADMIN, ROLES.SUPERADMIN]), productsRoutes);

routes.use("/api/product-variations", isAuthorized([ROLES.ADMIN, ROLES.SUPERADMIN]), productVariationRoutes);

routes.use('/api/skus', isAuthorized([ROLES.ADMIN, ROLES.SUPERADMIN]), skuRoutes);

routes.use('/api/bundle-skus', isAuthorized([ROLES.ADMIN, ROLES.SUPERADMIN]), bundleSkuRoutes);

export default routes;
