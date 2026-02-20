import express from "express";
import { completeOutletManagerSignup, completeSignup, deleteBrandManager, deleteOutletManager, getAllBrandManagers, getAllOutletManagers, getCurrentUser, login, logout, requestOutletManagerOTP, requestPasswordResetOTP, requestSignupOTP, resetPassword, updateOutletManagerPermissions, verifyOutletManagerOTP, verifyPasswordResetOTP, verifySignupOTP, } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { authRateLimit } from "../middlerwares/rateLimiter.middleware.js";


const router = express.Router();

router.post("/auth/login", authRateLimit, login);
router.post("/auth/logout", logout);
router.get("/me", verifyJwt, getCurrentUser);

router.get("/brand-managers", verifyJwt, getAllBrandManagers);
router.delete("/brand-managers/:managerId", verifyJwt, deleteBrandManager);
router.post("/auth/signup/otp", authRateLimit, verifyJwt, requestSignupOTP);
router.post("/auth/signup/verify", authRateLimit, verifyJwt, verifySignupOTP);
router.post("/brand-managers", verifyJwt, completeSignup);

router.get("/outlet-managers", verifyJwt, getAllOutletManagers);
router.delete("/outlet-managers/:managerId", verifyJwt, deleteOutletManager);
router.post("/auth/outlet-managers/otp", authRateLimit, verifyJwt, requestOutletManagerOTP);
router.post("/auth/outlet-managers/verify", authRateLimit, verifyJwt, verifyOutletManagerOTP);
router.post("/outlet-managers", verifyJwt, completeOutletManagerSignup);
router.put("/outlet-managers/:userId/permissions", verifyJwt, updateOutletManagerPermissions);

router.post("/auth/forgot-password/request-otp", authRateLimit, requestPasswordResetOTP);
router.post("/auth/forgot-password/verify-otp", authRateLimit, verifyPasswordResetOTP);
router.post("/auth/forgot-password/reset", authRateLimit, resetPassword);



export default router;