import { Router } from "express";
import payeeNameControllers from "../controllers/payeeName.js";

const routes = Router();

// Payee Names section - using "payee-names" permission key (matches sidebar key)
routes.post("/",  payeeNameControllers.addPayeeName);
routes.get("/",  payeeNameControllers.getPayeeNames);
routes.delete("/:id",  payeeNameControllers.deletePayeename);
routes.patch("/:id",  payeeNameControllers.updatePayeename);

export default routes;
