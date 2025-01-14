import { Router } from "express";
import {
    createKioskMaster,
    getKioskMaster,
    getKioskMasterList,
    updateKioskMaster,
    deleteKioskMaster,
} from "../controllers/kioskmaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/createkiosk").post(verifyJWT, isSuperAdmin,createKioskMaster);
router.route("/kiosk/:id").get(verifyJWT, isSuperAdmin,getKioskMaster);
router.route("/kiosklist").get(verifyJWT, isSuperAdmin,getKioskMasterList);
router.route("/kioskmasterupdate/:id").put(verifyJWT, isSuperAdmin,updateKioskMaster);
router.route("/deletekioskmaster/:id").delete(verifyJWT, isSuperAdmin,deleteKioskMaster);
export default router;
