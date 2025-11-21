import { Router } from "express";

// Controllers

import productVariationControllers from "../controllers/productVariation.js";
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

// Product CRUD routes
routes.post("/", productVariationControllers.addProductVariation);
routes.get(
    "/",
    getPagination,
    productVariationControllers.getProductVariations
);
routes.get("/:id", productVariationControllers.getProductVariationById);
routes.patch("/:id", productVariationControllers.updateProductVariation);
routes.delete("/:id", productVariationControllers.deleteProductVariation);

export default routes;
