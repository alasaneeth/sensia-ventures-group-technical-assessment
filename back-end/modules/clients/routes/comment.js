import { Router } from "express";
import commentControllers from "../controllers/comment.js";
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

// Comments section - using "comments" permission key
// Comments are related to clients, so might use "clients-list" or a separate "comments" key
// Based on RBAC structure, we'll use a separate "comments" permission
routes.get("/", getPagination, commentControllers.getComments);
routes.post("/:clientId", commentControllers.addComment);

export default routes;