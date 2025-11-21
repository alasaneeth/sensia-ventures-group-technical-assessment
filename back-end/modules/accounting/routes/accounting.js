import { Router } from "express";
// import getPayments from "../controllers/getPayments.js";
// import getInvoices from "../controllers/getInvoices.js";
// import addPayment from "../controllers/addPayment.js";
// import addInvoice from "../controllers/addInvoice.js";
// import getSummary from "../controllers/getSummary.js";
// import editInvoice from "../controllers/editInvoice.js";
// import editPayment from "../controllers/editPayment.js";
import accountingControllers from "../controllers/accounting.js";


// Middlewares
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

// Accounting section - using "accounting" permission key (matches sidebar key)
routes.get("/payments", getPagination, accountingControllers.getPayments);
routes.post("/payments", accountingControllers.addPayment);

routes.get("/invoices", getPagination, accountingControllers.getInvoices);
routes.post("/invoices", accountingControllers.addInvoice);

routes.get("/summary", getPagination, accountingControllers.getSummary);

routes.patch("/invoices/:id", accountingControllers.editInvoice);
routes.patch("/payments/:id", accountingControllers.editPayment);

export default routes;
