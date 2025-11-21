import { Router } from "express";

// Controllers
import productControllers from "../controllers/product.js";
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

// Product CRUD routes
routes.post("/", productControllers.addProduct);
routes.get("/", getPagination, productControllers.getProducts);
routes.get("/:id", productControllers.getProductById);
routes.patch("/:id", productControllers.updateProduct);
routes.delete("/:id", productControllers.deleteProduct);

export default routes;

