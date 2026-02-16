import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createStockMovement, getAllStockMovementsExceptOrders, getAllStockMovementsForOrders, getOrderConsumptionSummary, bulkCreateStockMovement } from "../controllers/stockMovement.controller.js";
import { ingredientUsageAndBurnRate } from "../controllers/analytic.controller.js";


const router = express.Router();

router.post("/", verifyJwt, createStockMovement);
router.post("/bulk", verifyJwt, bulkCreateStockMovement);
router.get("/", verifyJwt, getAllStockMovementsExceptOrders);
router.get("/orders", verifyJwt, getAllStockMovementsForOrders);
router.get("/consumption", verifyJwt, ingredientUsageAndBurnRate);

export default router;