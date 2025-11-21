import { Router } from "express";

// Controllers
// import getChainsOffers from "../controllers/getChainDetailsV1.js";

import chainControllers from "../controllers/chain.js";

const routes = Router();

// Offers Chains section - using "offers-chains" permission key (matches sidebar key)
routes.get("/", chainControllers.getChains);
routes.post("/", chainControllers.addChain);
routes.get("/:id", chainControllers.getChainById);
routes.get("/:id/offers", chainControllers.getChainsOffers);
routes.patch("/:id", chainControllers.updateChain);
routes.delete("/:id", chainControllers.deleteChain);


export default routes;
