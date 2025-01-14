import { Router } from "express";
import { createdepartmentMaster,getDepartmentMasterById,getDepartmentMasterList ,updateDepartmentMaster,deleteDepartmentMaster} from "../controllers/departmentmaster.controller.js";
import { isSuperAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/createdepartmentmaster").post(verifyJWT, isSuperAdmin,createdepartmentMaster);
router.route("/getdepartmentbyid/:id").get(verifyJWT, isSuperAdmin,getDepartmentMasterById);
router.route("/getdepartmentmasterlist").get(verifyJWT, isSuperAdmin,getDepartmentMasterList);
router.route("/updatedepartmentmaster/:id").put(verifyJWT, isSuperAdmin,updateDepartmentMaster);
router.route("/deletedepartmentmaster/:id").delete(verifyJWT, isSuperAdmin,deleteDepartmentMaster);
export default router;
