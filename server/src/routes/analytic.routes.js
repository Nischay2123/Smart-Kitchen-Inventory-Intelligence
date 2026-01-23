import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { itemsProfitPerDeployement ,ingredientDetialsPerDeployement,brandAnalyticsDetialedReport} from "../controllers/analytic.controller.js";



const router = express.Router();

router.get("/get_profit_data",verifyJwt, itemsProfitPerDeployement);
router.get("/get_ingredient_data",verifyJwt, ingredientDetialsPerDeployement);
router.get("/get_deployment_data",verifyJwt, brandAnalyticsDetialedReport);

export default router;