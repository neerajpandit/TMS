import { Router } from "express";
import {
    createSeatMaster,
    getSeatMaster,
    updateSeatMaster,
    deleteSeatMaster,
} from "../controllers/seatmaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router
    .route("/createseatmaster")
    .post(verifyJWT, isSuperAdmin, createSeatMaster);
router.route("/getseatmaster").get(verifyJWT, isSuperAdmin, getSeatMaster);
router
    .route("/updateseatmaster/:id")
    .patch(verifyJWT, isSuperAdmin, updateSeatMaster);
router
    .route("/deleteseatmaster/:id")
    .delete(verifyJWT, isSuperAdmin, deleteSeatMaster);
export default router;
