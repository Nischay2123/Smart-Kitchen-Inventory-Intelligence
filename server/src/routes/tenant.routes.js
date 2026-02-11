import express from "express";
import { createTenant, deleteTenant, getAllTenants } from "../controllers/tenant.controller.js";
import { verifyJwt } from "../middlerwares/auth.middleware.js";


const router = express.Router();

router.post("/", verifyJwt, createTenant);
router.get("/", verifyJwt, getAllTenants);
router.delete("/:tenantId", verifyJwt, deleteTenant);

export default router;