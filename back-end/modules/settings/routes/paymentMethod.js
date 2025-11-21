import { Router } from "express";
import paymentMethodControllers from "../controllers/paymentMethod.js";

const routes = Router();

// Payment methods section - using "payment-methods-list" permission key (matches sidebar key)
routes.get("/", paymentMethodControllers.getPaymentMethods);
routes.post("/", paymentMethodControllers.addPaymentMethod);

routes.patch("/:id", paymentMethodControllers.updatePaymentMethod);
routes.get("/:country", paymentMethodControllers.getPaymentMethodByCountry);

export default routes;
