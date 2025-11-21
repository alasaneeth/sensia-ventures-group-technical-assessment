import { Router } from "express";
import getPagination from "../../../middlewares/getPagination.js";

import addressControllers from "../controllers/address.js";

const routes = Router();

// PO Box section - using "address-list" permission key (matches sidebar key)
routes.get("/", getPagination, addressControllers.getAddresses);
routes.post("/", addressControllers.addAddress);

routes.get("/shipments", getPagination, addressControllers.getShipments);
routes.patch("/shipments/:id", addressControllers.updateShipment);

routes.post("/:id/shipments", addressControllers.addShipment);

routes.patch("/:id", addressControllers.updateAddress);

routes.patch("/:id/offers", addressControllers.updateOffersAddresses);

export default routes;
