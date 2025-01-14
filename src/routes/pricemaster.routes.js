import { Router } from "express";
import {
    allmasterData,
    createTicketPriceMaster,
    getTicketPriceMasterById,
    priceMasterList,
    definePrice,
    updateTicketPrice,
    deleteTicketPriceMaster,
} from "../controllers/pricemaster.controller.js";
import { createTicketPrice } from "../controllers/pricemaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
//not use
router.route("/addprice").post(isSuperAdmin, verifyJWT ,createTicketPriceMaster); //not use

//
router.route("/masterdata").get(verifyJWT, isSuperAdmin, allmasterData);
router.route("/defineprice").post(verifyJWT, isSuperAdmin,definePrice);
router.route("/submitprice").post(verifyJWT, isSuperAdmin,createTicketPrice);
router.route("/getprice/:id").get(verifyJWT, isSuperAdmin,getTicketPriceMasterById);
router.route("/pricelist").get(verifyJWT, isSuperAdmin,priceMasterList);
router.route("/updateprice/:id").put(verifyJWT, isSuperAdmin,updateTicketPrice);
router.route("/deleteprice/:id").delete(verifyJWT, isSuperAdmin,deleteTicketPriceMaster);
export default router;
