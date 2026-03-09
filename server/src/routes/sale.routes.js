import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { verifyPOSApiKey } from "../middlerwares/verifyPOSApiKey.middleware.js";
import { createSale, getAllSales } from "../controllers/sale.controller.js";
const router = express.Router();

router.get("/", verifyJwt, getAllSales);
router.post("/", verifyPOSApiKey, createSale);

export default router;