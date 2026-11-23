import { Router } from "express";
import aichatController from "../controllers/aichat.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/getResponse').post(verifyJWT,aichatController.getResponse)
router.route('/generateQuestions').post(verifyJWT,aichatController.generateQuestion)
router.route('/activity/quiz').post(verifyJWT,aichatController.saveQuizAttempt)
router.route('/activity/mine').get(verifyJWT, aichatController.getMyActivity)


export default router;
