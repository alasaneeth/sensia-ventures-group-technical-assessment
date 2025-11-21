import { Router } from "express";
import authControllers from '../controllers/auth.js';

// Middlewares
import isAuthenticated from "../../../middlewares/isAuthenticated.js";

const routes = Router();

routes.post("/login", authControllers.login);
routes.get("/logout", authControllers.logout);
routes.post("/create-user", authControllers.createUser);
routes.get("/get-session", isAuthenticated, authControllers.getSession);

export default routes;