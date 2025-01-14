import { Router } from "express";
import {
    createPassengerMaster,
    getPassengerMaster,
    deletePassengerMaster,
    updatePassengerMaster,
} from "../controllers/passengermaster.controller.js";
import {
    createPassengerSubCategory,
    getPassengerSubCategory,
    updatePassengerSubCategory,
    deletePassengerSubCategory,
} from "../controllers/passengersubcategory.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

//Passenger Master
router
    .route("/createpassengermaster")
    .post(verifyJWT, isSuperAdmin, createPassengerMaster);
router
    .route("/getpassengermaster")
    .get(verifyJWT, isSuperAdmin, getPassengerMaster);
router
    .route("/deletedpassengermaster/:id")
    .delete(verifyJWT, isSuperAdmin, deletePassengerMaster);
router
    .route("/updatepassengermaster/:id")
    .patch(verifyJWT, isSuperAdmin, updatePassengerMaster);

router
    .route("/:passengerMasterid/createpassengersubcategory")
    .post(verifyJWT, isSuperAdmin, createPassengerSubCategory);
router
    .route("/:passengerMasterid/getpassengersubcategory")
    .get(verifyJWT, isSuperAdmin, getPassengerSubCategory);
router
    .route("/:passengerMasterid/updatepassengersubcategory/:id")
    .patch(verifyJWT, isSuperAdmin, updatePassengerSubCategory);
router
    .route("/:passengerMasterid/deletepassengersubcategory/:id")
    .delete(verifyJWT, isSuperAdmin, deletePassengerSubCategory);
export default router;
