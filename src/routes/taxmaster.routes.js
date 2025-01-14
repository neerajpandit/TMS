import { Router } from "express";
import {
    createTaxMaster,
    updateTaxMaster,
    deleteTaxMaster,
    getTaxMaster,
} from "../controllers/taxmaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/createtaxmaster").post(verifyJWT, isSuperAdmin, createTaxMaster);
router.route("/gettaxmaster").get(verifyJWT, isSuperAdmin, getTaxMaster);
router
    .route("/updatetaxmaster/:id")
    .patch(verifyJWT, isSuperAdmin, updateTaxMaster);
router
    .route("/deletetaxmaster/:id")
    .delete(verifyJWT, isSuperAdmin, deleteTaxMaster);
export default router;
