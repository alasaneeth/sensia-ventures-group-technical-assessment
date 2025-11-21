import { Router } from "express";

import {
    uploadFile,
    handleMulterError,
} from "../middlewares/uploadMiddleware.js";

import clientControllers from "../controllers/client.js";
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

// Database section - using "clients-list" permission key (matches sidebar key)
routes.get("/", getPagination, clientControllers.getClients);
routes.get(
    "/not-extracted",
    getPagination,
    clientControllers.getNotExtractedClients
);
routes.post("/", clientControllers.addClient);

routes.post(
    "/import",
    uploadFile,
    handleMulterError,
    clientControllers.importDatabase
);
routes.get(
    "/import-history",

    getPagination,
    clientControllers.getImportHistory
);

// Update client data
routes.patch("/:id", clientControllers.updateClient);
routes.get("/:id", clientControllers.getClient);

export default routes;
