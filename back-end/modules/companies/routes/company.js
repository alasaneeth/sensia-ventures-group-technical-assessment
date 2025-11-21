import { Router } from "express";

import companyControllers from "../controllers/company.js";
import brandRoutes from "./brand.js";

const routes = Router();

// Companies section - using "companies" permission key (matches sidebar key)
// Note: This is super admin only, but permission check will enforce it
routes.post("/", companyControllers.addCompany);
routes.get("/", companyControllers.getCompanies);

// THSI IS GET REQUEST but we used it as POST to use the body
routes.post("/brands", companyControllers.getBrandsForCompanies);

routes.get("/:id", companyControllers.getCompany);
routes.patch("/:id", companyControllers.updateCompany);
routes.delete("/:id", companyControllers.deleteCompany);

// Brand routes nested under companies
routes.use("/", brandRoutes);

export default routes;

