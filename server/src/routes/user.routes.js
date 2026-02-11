import express from "express";
import { completeOutletManagerSignup, completeSignup, deleteBrandManager, deleteOutletManager, getAllBrandManagers, getAllOutletManagers, getCurrentUser, login, logout, requestOutletManagerOTP, requestPasswordResetOTP, requestSignupOTP, resetPassword, updateOutletManagerPermissions, verifyOutletManagerOTP, verifyPasswordResetOTP, verifySignupOTP, } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";


const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifyJwt, getCurrentUser);

router.get("/get_all_brand_manager", verifyJwt, getAllBrandManagers);
router.delete("/delete_brand_manager/:managerId", verifyJwt, deleteBrandManager);

router.post("/genrate_otp", verifyJwt, requestSignupOTP);
router.post("/verify_otp", verifyJwt, verifySignupOTP);
router.post("/create_brand_manager", verifyJwt, completeSignup);

router.get("/get_all_oulet_manager", verifyJwt, getAllOutletManagers);
router.delete("/delete_outlet_manager/:managerId", verifyJwt, deleteOutletManager);
router.post("/genrate_otp_outlet", verifyJwt, requestOutletManagerOTP);
router.post("/verify_otp_outlet", verifyJwt, verifyOutletManagerOTP);
router.post("/create_outlet_manager", verifyJwt, completeOutletManagerSignup);
router.post("/permissions_outlet_managers/:userId", verifyJwt, updateOutletManagerPermissions);

router.post("/forgot-password/request-otp", requestPasswordResetOTP);
router.post("/forgot-password/verify-otp", verifyPasswordResetOTP);
router.post("/forgot-password/reset", resetPassword);



export default router;