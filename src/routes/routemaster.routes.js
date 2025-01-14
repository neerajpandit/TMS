import { Router } from "express";
import {
    createRouteMaster,
    deleteRouteMaster,
    getRouteMasterDetails,
    getRouteMasterDetailsById,
    updateRouteMaster,
} from "../controllers/routemaster.controller.js";
import {
    isAdmin,
    isSuperAdmin,
    verifyJWT,
} from "../middlewares/auth.middleware.js";

const router = Router();
// import { verifyJWT } from "../middlewares/auth.middleware.js";
router
    .route("/createroutemaster")
    .post(verifyJWT, isSuperAdmin, createRouteMaster);
router
    .route("/getroutemaster")
    .get(verifyJWT, isSuperAdmin, getRouteMasterDetails);
router
    .route("/getroutemaster/:id")
    .get(verifyJWT, isSuperAdmin, getRouteMasterDetailsById);
router
    .route("/updateroutemaster/:id")
    .patch(verifyJWT, isSuperAdmin, updateRouteMaster);
router
    .route("/deleteroutemaster/:id")
    .delete(verifyJWT, isSuperAdmin, deleteRouteMaster);

export default router;
