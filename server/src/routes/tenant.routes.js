import express from "express";
import { createTenant, deleteTenant, getAllTenants } from "../controllers/tenant.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";


const router = express.Router();

router.post("/create_tenant",verifyJwt, createTenant);
router.get("/get_all_tenant",verifyJwt, getAllTenants);
router.delete("/delete/:tenantId",verifyJwt, deleteTenant);

export default router;