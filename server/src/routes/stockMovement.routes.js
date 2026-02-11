import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createStockMovement, getAllStockMovementsExceptOrders, getAllStockMovementsForOrders, getOrderConsumptionSummary } from "../controllers/stockMovement.controller.js";
import { ingredientUsageAndBurnRate } from "../controllers/analytic.controller.js";


const router = express.Router();

router.post("/create_stock_movement",verifyJwt, createStockMovement);
router.get("/get_stock_movements",verifyJwt, getAllStockMovementsExceptOrders);
router.get("/get_orders_stock_movements",verifyJwt, getAllStockMovementsForOrders);
router.get("/get_stock_consumption",verifyJwt, ingredientUsageAndBurnRate);

export default router;