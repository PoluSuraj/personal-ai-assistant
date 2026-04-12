import { Router } from "express";
import wikipediaController from "../controllers/wikipedia.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/search").get(wikipediaController.searchArticles);

export default router;
