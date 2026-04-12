import { Router } from "express";
import youtubeController from "../controllers/youtube.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/search").get(youtubeController.searchVideos);

export default router;
