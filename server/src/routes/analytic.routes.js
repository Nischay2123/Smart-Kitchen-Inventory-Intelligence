import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { itemsProfitPerDeployement ,brandAnalyticsDetialedReport, menuEngineeringMatrix, ingredientUsageAndBurnRate, getOutlets, brandAnalyticsSnapshotReport, brandAnalyticsLiveReport} from "../controllers/analytic.controller.js";



const router = express.Router();

router.get("/get_profit_data",verifyJwt, itemsProfitPerDeployement);
router.get("/get_ingredient_data",verifyJwt, ingredientUsageAndBurnRate);
router.post("/get_deployment_data",verifyJwt, brandAnalyticsSnapshotReport);
router.post("/get_deployment_data_live",verifyJwt, brandAnalyticsLiveReport);
router.get("/get_menu_matrix",verifyJwt, menuEngineeringMatrix);
router.get("/get_outlets",verifyJwt, getOutlets);

export default router;