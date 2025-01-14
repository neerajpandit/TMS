import { Router } from "express";
import {
    createTransportsubcategoryType,
    updateTransportsubcategoryType,
    deleteTransportsubcategoryType,
    getTransportsubcategoryType,
} from "../controllers/transportsubcategory.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// import { verifyJWT } from "../middlewares/auth.middleware.js";
router
    .route("/transportmaster/:transportMasterid/subcategory")
    .post(verifyJWT, isSuperAdmin, createTransportsubcategoryType);
router
    .route("/gettransportsubcategory")
    .get(verifyJWT, isSuperAdmin, getTransportsubcategoryType);
router
    .route("/updatetransportsubcategory/:id")
    .put(verifyJWT, isSuperAdmin, updateTransportsubcategoryType);
router
    .route("/deletedtransportsubcategory/:id")
    .delete(verifyJWT, isSuperAdmin, deleteTransportsubcategoryType);
export default router;
