import { Router } from "express";

import campaignControllers from "../controllers/campaign.js";
import keyCodeControllers from "../controllers/keyCode.js";

// Controllers
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();
// Protect these endpoints with permission checks

// Campaigns section - using "campaigns" permission key
routes.post("/", campaignControllers.addCampaign);
routes.get("/", getPagination, campaignControllers.getCampaigns);

routes.get('/offers/:offerId/', campaignControllers.getLastCamChain);
routes.get("/keycodes/:id", keyCodeControllers.getCampaignKeyCodes);

routes.get("/:campaignId/offers/:offerId/payeename", campaignControllers.getPayeeName);


routes.get("/:id", campaignControllers.getCampaignById);
routes.patch("/:id", campaignControllers.updateCampaign);
routes.delete("/:id", campaignControllers.deleteCampaign);

routes.post("/:campaignId/keycodes", keyCodeControllers.createKey);
routes.get(
    "/:campaignId/keycodes",
    keyCodeControllers.getCampaignKeyCodesCount
);
routes.post("/:campaignId/extract", keyCodeControllers.extractCampaign);

export default routes;
