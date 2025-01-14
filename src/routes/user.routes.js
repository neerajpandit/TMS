import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    deleteAccount,
    resetPassword,
    forgotPassword,
    updateAccountDetails,
    getCurrentUser,
} from "../controllers/user.controller.js";
import upload from "../utils/multer.js";
import { validateRequestBody } from "../middlewares/validation.middleware.js";

const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";

//Admin Related
router.route("/signup").post(upload.single("profile"), registerUser);
router.route("/signin").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/deleteAccount").delete(verifyJWT, deleteAccount);
router.route("/resetPassword").post(resetPassword);
router.route("/updateaccount").patch(verifyJWT, updateAccountDetails);
router.route("/getCurrentUser").get(getCurrentUser);
//email forgot
router.route("/emailforgotpassword").post(forgotPassword);

export default router;
