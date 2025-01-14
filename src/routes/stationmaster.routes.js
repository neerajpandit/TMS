import { Router } from "express";
import {
    createStationMaster,
    deleteStationMaster,
    getStationMaster,
    updateStationMaster,
} from "../controllers/staionmaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// import { verifyJWT } from "../middlewares/auth.middleware.js";
router
    .route("/createstationmaster")
    .post(verifyJWT, isSuperAdmin, createStationMaster);
router
    .route("/getstationmaster")
    .get(verifyJWT, isSuperAdmin, getStationMaster);
router
    .route("/deletestationmaster/:id")
    .delete(verifyJWT, isSuperAdmin, deleteStationMaster);
router
    .route("/updatestationmaster/:id")
    .patch(verifyJWT, isSuperAdmin, updateStationMaster);

export default router;
