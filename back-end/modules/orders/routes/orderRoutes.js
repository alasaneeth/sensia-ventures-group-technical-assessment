import { Router } from "express";

import orderControllers from "../controllers/order.js";
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

routes.post("/", orderControllers.placeOrder);
routes.get("/", getPagination, orderControllers.getOrders);
routes.delete("/:id", orderControllers.deleteOrder);
routes.patch("/:id", orderControllers.updateOrder);

routes.post("/not-selected", orderControllers.placeOrderNotSelected);
routes.get("/summary", getPagination, orderControllers.getSummary);

export default routes;
