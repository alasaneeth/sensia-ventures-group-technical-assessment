import { Router } from "express";

// Controllers
import importOffers from "../controllers/importOffers.js";

// Middlewares
import {
    uploadFile,
    handleMulterError,
} from "../middlewares/uploadMiddleware.js";
// Controllers
import getPagination from "../../../middlewares/getPagination.js";

import offerControllers from "../controllers/offer.js";
import offerPrintControllers from "../controllers/offerPrint.js";

const routes = Router();

routes.get("/", getPagination, offerControllers.getOffers);
routes.post("/", offerControllers.addOffer);
routes.get("/exportation", getPagination, offerPrintControllers.getPrinterRecords);
routes.get("/mail-files", getPagination, offerControllers.getMailFiles);
routes.get("/mail-files/search", offerControllers.searchForClientOffer);

routes.get("/:id", offerControllers.getOffer);
routes.delete("/:id", offerControllers.deleteOffer);
routes.patch("/:id", offerControllers.updateOffer);


routes.get("/exportation/history", getPagination, offerPrintControllers.getPrinterHistory);

routes.post("/exportation", offerPrintControllers.printRecords);

routes.get("/exportation/:id", offerPrintControllers.printHistoryRecords);

// Offer letter route
routes.post("/letter", offerControllers.addOfferLetter);

// Import route with file upload middleware
routes.post("/import", uploadFile, handleMulterError, importOffers); // IGNORE FOR NOW

export default routes;
