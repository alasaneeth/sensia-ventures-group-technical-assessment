import { Router } from "express";
import devCommentControllers from "../controllers/devComment.js";

// Middlewares
import getPagination from "../../../middlewares/getPagination.js";

const routes = Router();

// Dev Comments section - using "dev-comments" permission key (matches sidebar key)
// Get all comments
routes.get("/", getPagination, devCommentControllers.getComments);

// Add a new comment
routes.post("/", devCommentControllers.addComment);

// Update a comment (only the creator can update)
routes.patch("/:id", devCommentControllers.updateComment);

export default routes;
