import { Router } from "express";
import countryControllers from "../controllers/country.js";
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

// Countries section - Note: Countries might need a specific permission key
// For now, using a general permission, or it could be part of settings
// Let's check what makes sense - countries are likely part of campaigns/addresses
// Since it's under settings and accessible to most, we'll use "countries" as key
routes.get("/", getPagination, countryControllers.getCountries);
routes.post("/", countryControllers.addCountry);
routes.patch("/:id", countryControllers.updateCountry);
routes.delete("/:id", countryControllers.deleteCountry);

export default routes;