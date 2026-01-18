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

const router = express.Router();

router.use("/users", Users);
router.use("/tenants", Tenants);
router.use("/outlets", Outlets);
router.use("/menu", Menus);
router.use("/units", Unit);
router.use("/ingredient", IngredientMaster);
router.use("/recipes", Recipe);
router.use("/stocks", Stocks);
router.use("/stockMovements", StockMovements);

export default router;