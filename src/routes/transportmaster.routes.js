import { Router } from "express";
import {
    createTransportType,
    getTransportType,
    updateTransportType,
    deleteTransportType,
    getSubCategories,
} from "../controllers/transportmaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// import { verifyJWT } from "../middlewares/auth.middleware.js";
router
    .route("/createtransporttype")
    .post(verifyJWT, isSuperAdmin, createTransportType);
router
    .route("/gettransporttype")
    .get(verifyJWT, isSuperAdmin, getTransportType);
router
    .route("/updatetransporttype/:id")
    .put(verifyJWT, isSuperAdmin, updateTransportType);
router
    .route("/deletedteransporttype/:id")
    .delete(verifyJWT, isSuperAdmin, deleteTransportType);
// router.route("/createtransporttype").post(createTransportType);
// router.route("/gettransporttype").get(getTransportType);
router.route("/getsubcategory/:id").get(getSubCategories);
// router.route("/updatetransporttype/:id").patch(updateTransportType);
// router.route("/deletedteransporttype/:id").delete(deleteTransportType);

export default router;
