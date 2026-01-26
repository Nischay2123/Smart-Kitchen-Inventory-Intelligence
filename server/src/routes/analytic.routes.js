import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { itemsProfitPerDeployement ,brandAnalyticsDetialedReport, menuEngineeringMatrix, ingredientUsageAndBurnRate, getOutlets} from "../controllers/analytic.controller.js";



const router = express.Router();

router.get("/get_profit_data",verifyJwt, itemsProfitPerDeployement);
router.get("/get_ingredient_data",verifyJwt, ingredientUsageAndBurnRate);
router.get("/get_deployment_data",verifyJwt, brandAnalyticsDetialedReport);
router.get("/get_menu_matrix",verifyJwt, menuEngineeringMatrix);
router.get("/get_outlets",verifyJwt, getOutlets);

export default router;