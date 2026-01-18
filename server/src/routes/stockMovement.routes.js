import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createStockMovement, getAllStockMovementsExceptOrders } from "../controllers/stockMovement.controller.js";


const router = express.Router();

router.post("/create_stock_movement",verifyJwt, createStockMovement);
router.get("/get_stock_movements",verifyJwt, getAllStockMovementsExceptOrders);

export default router;