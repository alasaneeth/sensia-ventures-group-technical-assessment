import { Router } from "express";

// Controllers
import skuControllers from "../controllers/sku.js";
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

// SKU CRUD routes
routes.post("/", skuControllers.addSku);
routes.get("/", getPagination, skuControllers.getSkus);
routes.get("/:id", skuControllers.getSkuById);
routes.patch("/:id", skuControllers.updateSku);
routes.delete("/:id", skuControllers.deleteSku);

export default routes;

