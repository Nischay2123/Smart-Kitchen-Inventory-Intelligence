import express from "express";

import Users from "./user.routes.js";
import Tenants from "./tenant.routes.js";
import Outlets from "./outlet.routes.js";
import Menus from "./menuItem.routes.js";
import IngredientMaster from "./ingredientMaster.routes.js";
import Recipe from "./recipe.routes.js";
import Unit from "./baseUnit.routes.js";
import Stocks from "./stock.routes.js";
import StockMovements from "./stockMovement.routes.js";
import Sales from "./sale.routes.js";
import Analytics from "./analytic.routes.js";
import Csv from "./csv.routes.js";
import SchedulerLogs from "./scheduler.routes.js";
import POSApiKeys from "./posApiKey.routes.js";

const router = express.Router();

router.use("/users", Users);
router.use("/tenants", Tenants);
router.use("/outlets", Outlets);
router.use("/menu-items", Menus);
router.use("/units", Unit);
router.use("/ingredients", IngredientMaster);
router.use("/recipes", Recipe);
router.use("/stocks", Stocks);
router.use("/stock-movements", StockMovements);
router.use("/sales", Sales);
router.use("/analytics", Analytics);
router.use("/csv", Csv);
router.use("/scheduler-logs", SchedulerLogs);
router.use("/pos-api-keys", POSApiKeys);

export default router;