import { Router } from "express";
import { createVehicleMaster,creategridVehicleMaster, vehicleMasterList ,getvehiclemasterbyid, allmasterData,updateVehicleMaster,deleteVehicleMaster} from "../controllers/vehiclemaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/createVehicle").post(verifyJWT, isSuperAdmin,createVehicleMaster);
router.route("/gridVehicle").post(verifyJWT, isSuperAdmin,creategridVehicleMaster);
router.route("/vehiclemasterList").get(verifyJWT, isSuperAdmin,vehicleMasterList);
router.route("/allmasterData").get( verifyJWT, isSuperAdmin,allmasterData);
router.route("/vehicledetail/:id").get(verifyJWT, isSuperAdmin,getvehiclemasterbyid);
router.route('/vehicle/:id').put(verifyJWT, isSuperAdmin,updateVehicleMaster);
router.route('/deletevehicle/:id').delete(verifyJWT, isSuperAdmin,deleteVehicleMaster);

export default router;