import { Router } from "express";
import aichatController from "../controllers/aichat.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/getResponse').post(verifyJWT,aichatController.getResponse)
router.route('/generateQuestions').post(verifyJWT,aichatController.generateQuestion)


export default router;