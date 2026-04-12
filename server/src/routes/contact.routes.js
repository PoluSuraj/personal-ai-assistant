import { Router } from "express";
import contactController from "../controllers/contact.controller.js";
import { requireAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();

router.route("/send").post(contactController.sendContactMessage);
router.route("/subscribe").post(contactController.subscribeNewsletter);
router.route("/all").get(verifyJWT, requireAdmin, contactController.getAllContactMessages);
router.route("/:id").get(verifyJWT, requireAdmin, contactController.getContactMessage);
router.route("/:id").patch(verifyJWT, requireAdmin, contactController.updateContactMessage);

export default router;
