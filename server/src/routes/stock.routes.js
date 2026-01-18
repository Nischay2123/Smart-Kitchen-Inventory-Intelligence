import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { getAllStockDetails } from "../controllers/stock.controller.js";


const router = express.Router();

router.get("/get_stock_details",verifyJwt, getAllStockDetails);

export default router;