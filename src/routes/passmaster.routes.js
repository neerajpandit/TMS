import { Router } from "express";
import {
    createPassMaster,
    definepassPrice,
    getPassMasterById,
    passMasterList,
    updatePassMaster,
    allpassmaster,
    deletePassMaster,
} from "../controllers/passmaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/passprice").post(verifyJWT, isSuperAdmin,definepassPrice);
router.route("/createpass").post(verifyJWT, isSuperAdmin,createPassMaster);
router.route("/allmasterdata").get(verifyJWT, isSuperAdmin,allpassmaster);
router.route("/getpassmaster/:id").get(verifyJWT, isSuperAdmin,getPassMasterById);
router.route("/passmasterlist").get(verifyJWT, isSuperAdmin,passMasterList); //yeah get kr rha h pass master data ko
router.route("/updatepassmaster/:id").put(verifyJWT, isSuperAdmin,updatePassMaster);
router.route("/deletepassmaster/:id").delete(verifyJWT, isSuperAdmin,deletePassMaster);
export default router;
