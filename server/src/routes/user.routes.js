import express from "express";
import {  completeOutletManagerSignup, completeSignup, deleteBrandManager, deleteOutletManager, getAllBrandManagers, getAllOutletManagers, getCurrentUser, login, logout, requestOutletManagerOTP, requestSignupOTP, verifyOutletManagerOTP, verifySignupOTP, } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";


const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me",verifyJwt,getCurrentUser);

// router.post("/create_brand_admin",verifyJwt, createBrandManager);
router.get("/get_all_brand_manager",verifyJwt,getAllBrandManagers);
router.delete("/delete_brand_manager/:managerId",verifyJwt,deleteBrandManager);

router.post("/genrate_otp",verifyJwt,requestSignupOTP);
router.post("/verify_otp",verifyJwt,verifySignupOTP);
router.post("/create_brand_manager",verifyJwt,completeSignup);

// router.post("/create_outlet_admin",verifyJwt, createOutletManager);
router.get("/get_all_oulet_manager",verifyJwt,getAllOutletManagers);
router.delete("/delete_outlet_manager/:managerId",verifyJwt,deleteOutletManager);
router.post("/genrate_otp_outlet",verifyJwt,requestOutletManagerOTP);
router.post("/verify_otp_outlet",verifyJwt,verifyOutletManagerOTP);
router.post("/create_outlet_manager",verifyJwt,completeOutletManagerSignup);



export default router;