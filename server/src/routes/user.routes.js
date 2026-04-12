import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { requireAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = new Router();

router.route("/register").post(userController.registerUser);
router.route("/login").post(userController.loginUser);
router.route("/logout").post(verifyJWT, userController.logoutUser);
router.route("/changePassword").post(verifyJWT, userController.changeUserPassword);
router.route("/getCurrentUser").get(verifyJWT, userController.getCurrentUser);
router.route("/updateAvatar").post(verifyJWT, upload.single("avatar"), userController.updateAvatar);
router.route("/update-account").patch(verifyJWT, userController.updateAccountDetails);
router.route('/registerWithGoogle').post(userController.registerWithGoogle);
router.route('/loginWithGoogle').post(userController.loginWithGoogle);
router.route('/verifyOTP').post(userController.verifyOtp);
router.route('/forgotPassword').post(userController.forgotPassword);
router.route('/resetPassword').post(userController.resetPassword);
router.route('/admins').get(verifyJWT, requireAdmin, userController.listAdmins);
router.route('/admins/grant').patch(verifyJWT, requireAdmin, userController.grantAdminAccess);
router.route('/admins/revoke').patch(verifyJWT, requireAdmin, userController.revokeAdminAccess);
router.route('/manage-users').get(verifyJWT, requireAdmin, userController.listUsers);
router.route('/manage-users').post(verifyJWT, requireAdmin, userController.createUserManually);
router.route('/manage-users').delete(verifyJWT, requireAdmin, userController.removeUserManually);

export default router;
