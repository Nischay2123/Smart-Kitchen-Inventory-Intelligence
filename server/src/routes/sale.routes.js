import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createSale, getAllSales } from "../controllers/sale.controller.js";
const router = express.Router();

router.get("/get_sales",verifyJwt, getAllSales);
router.post("/",createSale)

export default router;