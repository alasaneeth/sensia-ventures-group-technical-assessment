import getPagination from "../../../middlewares/getPagination.js";
import categoryControllers from "../controllers/category.js";
import { Router } from "express";

const routes = Router();

routes.get("/", getPagination, categoryControllers.getCategories);
routes.post("/", categoryControllers.addCategory);
routes.put("/:id", categoryControllers.updateCategory);
routes.delete("/:id", categoryControllers.deleteCategory);

export default routes;
