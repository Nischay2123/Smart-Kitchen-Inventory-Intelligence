import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { itemsProfitPerDeployement, menuEngineeringMatrix, ingredientUsageAndBurnRate, getOutlets, brandAnalyticsSnapshotReport, brandAnalyticsLiveReport, requestProfitExport, requestMenuMatrixExport } from "../controllers/analytic.controller.js";



const router = express.Router();

// Data endpoints (range ≤ 30 days)
router.get("/profit", verifyJwt, itemsProfitPerDeployement);
router.get("/menu-matrix", verifyJwt, menuEngineeringMatrix);

// Export endpoints (range > 30 days) — queue job, send email via worker
router.post("/profit/export", verifyJwt, requestProfitExport);
router.post("/menu-matrix/export", verifyJwt, requestMenuMatrixExport);

router.get("/ingredients/usage", verifyJwt, ingredientUsageAndBurnRate);
router.post("/reports/deployment-snapshot", verifyJwt, brandAnalyticsSnapshotReport);
router.post("/reports/deployment-live", verifyJwt, brandAnalyticsLiveReport);
router.get("/outlets", verifyJwt, getOutlets);

export default router;