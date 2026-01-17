import express from "express";
import { createBrandManager, createOutletManager, deleteBrandManager, deleteOutletManager, getAllBrandManagers, getAllOutletManagers, getCurrentUser, login, logout, } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";


const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me",verifyJwt,getCurrentUser);

router.post("/create_brand_admin",verifyJwt, createBrandManager);
router.get("/get_all_brand_manager",verifyJwt,getAllBrandManagers);
router.delete("/delete_brand_manager/:managerId",verifyJwt,deleteBrandManager);

router.post("/create_outlet_admin",verifyJwt, createOutletManager);
router.get("/get_all_oulet_manager",verifyJwt,getAllOutletManagers);
router.delete("/delete_outlet_manager/:managerId",verifyJwt,deleteOutletManager);


export default router;