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

import Outlet from "../models/outlet.model.js";
import Tenant from "../models/tenant.model.js";
import MenuItem from "../models/menuItem.model.js";
import { runDailySnapshotJob } from "../crons/dailySnapshot.cron.js";

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
router.use("/sales",Sales);
router.use("/analytics",Analytics);


router.post("/genrate_sanpshot",runDailySnapshotJob)


router.get("/get_all_tenants",async(req,res)=>{
    const result = await Tenant.find({})

    return res.status(200).json({
        data:result
    })
})
router.get("/get_all_outlets",async(req,res)=>{
    const result = await Outlet.find({})

    return res.status(200).json({
        data:result
    })
})
router.get("/get_all_items",async(req,res)=>{
    const result = await MenuItem.find({})

    return res.status(200).json({
        data:result
    })
})


export default router;