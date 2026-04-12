import { Router } from "express";
import notificationController from "../controllers/notification.controller.js";
import { requireAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();

router.route("/").get(verifyJWT, notificationController.listNotifications);
router.route("/:id/read").patch(verifyJWT, notificationController.markNotificationRead);
router.route("/send").post(verifyJWT, requireAdmin, notificationController.sendDirectNotification);
router.route("/broadcast").post(verifyJWT, requireAdmin, notificationController.broadcastNotification);

export default router;
