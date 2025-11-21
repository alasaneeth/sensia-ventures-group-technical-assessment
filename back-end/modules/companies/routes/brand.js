import { Router } from "express";

import brandControllers from "../controllers/brand.js";
const routes = Router();

// Brands are part of companies, so using "companies" permission key
// More specific routes first (brands/:id)
routes.get("/brands/:id", brandControllers.getBrand);
routes.patch("/brands/:id", brandControllers.updateBrand);
routes.delete("/brands/:id", brandControllers.deleteBrand);

// Company-specific routes (/:companyId/brands)
routes.post("/:companyId/brands", brandControllers.addBrand);
routes.get("/:companyId/brands", brandControllers.getBrands);

export default routes;

