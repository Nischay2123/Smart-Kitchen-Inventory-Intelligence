import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { menuEngineeringMatrix, ingredientUsageAndBurnRate, getOutlets, brandAnalyticsSnapshotReport, brandAnalyticsLiveReport, itemSnapshotReport, itemLiveReport } from "../controllers/analytic.controller.js";



const router = express.Router();

// router.get("/profit", verifyJwt, itemsProfitPerDeployement);
router.get("/ingredients/usage", verifyJwt, ingredientUsageAndBurnRate);
router.post("/reports/deployment-snapshot", verifyJwt, brandAnalyticsSnapshotReport);
router.post("/reports/deployment-live", verifyJwt, brandAnalyticsLiveReport);
router.post("/reports/item-snapshot", verifyJwt, itemSnapshotReport);
router.post("/reports/item-live", verifyJwt, itemLiveReport);
router.get("/menu-matrix", verifyJwt, menuEngineeringMatrix);
router.get("/outlets", verifyJwt, getOutlets);

export default router;