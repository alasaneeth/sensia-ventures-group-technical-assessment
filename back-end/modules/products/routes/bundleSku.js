import { Router } from "express";

// Controllers
import bundleSkuControllers from "../controllers/bundleSku.js";
import getPagination from "../../../middlewares/getPagination.js";
const routes = Router();

// Bundle SKU CRUD routes
routes.post("/", bundleSkuControllers.addBundleSku);
routes.get("/", getPagination, bundleSkuControllers.getBundleSkus);
routes.get("/:id", bundleSkuControllers.getBundleSkuById);
routes.patch("/:id", bundleSkuControllers.updateBundleSku);
routes.delete("/:id", bundleSkuControllers.deleteBundleSku);

export default routes;
