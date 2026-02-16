import * as csv from "fast-csv";
import IngredientMaster from "../models/ingredientMaster.model.js";
import MenuItem from "../models/menuItem.model.js";
import Recipe from "../models/recipes.model.js";
import Stock from "../models/stock.model.js";
import Tenant from "../models/tenant.model.js";
import Outlet from "../models/outlet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";


const validateTenant = async (tenantId) => {
    // console.log("tenant",tenantId);

    const tenant = await Tenant.findOne({ _id: tenantId }).lean();
    console.log(tenant);

    if (!tenant) throw new ApiError(404, "TENANT_NOT_FOUND");
    return tenant;
};

const validateOutlet = async (tenantId, outletId) => {
    // console.log("outlet",tenantId, outletId);

    const outlet = await Outlet.findOne({
        "tenant.tenantId": new mongoose.Types.ObjectId(tenantId),
        _id: new mongoose.Types.ObjectId(outletId),
    }).lean();

    if (!outlet) throw new ApiError(404, "OUTLET_NOT_FOUND");
    return outlet;
};


export const exportCsv = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { tenant, outlet } = req.user;

    if (!tenant?.tenantId) {
        throw new ApiError(400, "Tenant ID required");
    }
    // console.log(tenant);

    await validateTenant(tenant.tenantId);

    let targetOutletId = outlet?.outletId;

    if (type === "stock") {
        if (!targetOutletId) {
            throw new ApiError(400, "Outlet ID required for stock export");
        }
        await validateOutlet(tenant.tenantId, targetOutletId);
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=${type}-${Date.now()}.csv`
    );

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    switch (type) {
        case "ingredient": {
            const ingredients = await IngredientMaster.find({
                "tenant.tenantId": tenant.tenantId,
            }).lean();

            for (const ing of ingredients) {
                const thresholdUnit = ing.threshold?.unit;
                const unitNames = (ing.unit || []).map(u => u.unitName).join(" $$ ");

                const row = {
                    Name: ing.name,
                    Units: unitNames,
                    BaseUnit: ing.unit[0]?.baseUnit,
                    Low: ing.threshold?.lowInBase / thresholdUnit?.conversionRate,
                    Critical: ing.threshold?.criticalInBase / thresholdUnit?.conversionRate,
                    ThresholdUnit: thresholdUnit?.unitName,
                };

                csvStream.write(row);
            }

            break;
        }



        case "menu-item": {
            const items = await MenuItem.find({
                "tenant.tenantId": tenant.tenantId,
            }).lean();

            for (const item of items) {
                csvStream.write({
                    ItemName: item.itemName,
                    Price: item.price,
                });
            }
            break;
        }

        case "recipe": {
            const recipes = await Recipe.find({
                "tenant.tenantId": tenant.tenantId,
            }).lean();

            for (const recipe of recipes) {
                for (const item of recipe.recipeItems || []) {
                    csvStream.write({
                        ItemName: recipe.item?.itemName,
                        IngredientName: item.ingredientName,
                        Quantity: item.qty,
                        Unit: item.unit,
                    });
                }
            }
            break;
        }

        case "stock": {
            const stocks = await Stock.find({
                "outlet.outletId": targetOutletId,
            }).lean();
            const now = new Date();
            const formattedDate = now.toISOString().substring(0, 10);
            const timestamp = now.toISOString().substring(11, 19);

            for (const stock of stocks) {
                csvStream.write({
                    IngredientName:
                        stock.masterIngredient.ingredientMasterName,
                    Quantity: stock.currentStockInBase,
                    baseUnit: stock.baseUnit,
                    AlertState: stock.alertState,
                    time: timestamp,
                    date: formattedDate
                });
            }
            break;
        }

        default:
            throw new ApiError(400, "Invalid export type");
    }

    csvStream.end();
});


export const getTemplate = async (req, res) => {
    try {
        const { type } = req.params;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=template-${type}.csv`);

        const csvStream = csv.format({ headers: true });
        csvStream.pipe(res);

        switch (type) {
            case "ingredient":
                csvStream.write({
                    Name: "Example Ingredient",
                    Units: "kg $$ g",
                    BaseUnit: "g",
                    Low: "10",
                    Critical: "5",
                    ThresholdUnit: "kg"
                });
                break;
            case "menu-item":
                csvStream.write({ ItemName: "Example Item", Price: "100" });
                break;
            case "recipe":
                csvStream.write({ ItemName: "", IngredientName: "", Quantity: "", Unit: "" });
                break;
            case "stock-movement":
                csvStream.write({
                    IngredientName: "Tomato",
                    Quantity: "10",
                    Unit: "kg",
                    Reason: "PURCHASE",
                    Price: "30"
                });

                csvStream.write({
                    IngredientName: "Tomato",
                    Quantity: "2",
                    Unit: "kg",
                    Reason: "POSITIVE_ADJUSTMENT",
                    Price: ""
                });

                csvStream.write({
                    IngredientName: "Tomato",
                    Quantity: "1",
                    Unit: "kg",
                    Reason: "NEGATIVE_ADJUSTMENT",
                    Price: ""
                });

                break;

        }
        csvStream.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Template failed" });
    }
};
