import * as csv from "fast-csv";
import IngredientMaster from "../models/ingredientMaster.model.js";
import MenuItem from "../models/menuItem.model.js";
import Recipe from "../models/recipes.model.js";
import Stock from "../models/stock.model.js";
import Tenant from "../models/tenant.model.js";
import Outlet from "../models/outlet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import mongoose from "mongoose";

const writeCsvRow = (stream, row) =>
    new Promise((resolve) => {
        if (stream.write(row)) return resolve();
        stream.once("drain", resolve);
    });

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

    await validateTenant(tenant.tenantId);

    let targetOutletId = outlet?.outletId;

    if (type === "stock-movement") {
        if (!targetOutletId) {
            throw new ApiError(400, "Outlet ID required");
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
            const cursor = IngredientMaster.find(
                { "tenant.tenantId": tenant.tenantId },
                {
                    name: 1,
                    unit: 1,
                    threshold: 1,
                }
            ).lean().cursor();

            for await (const ing of cursor) {
                const thresholdUnit = ing.threshold?.unit;
                const unitNames =
                    (ing.unit || []).map(u => u.unitName).join(" $$ ");

                await writeCsvRow(csvStream, {
                    Name: ing.name,
                    Units: unitNames,
                    BaseUnit: ing.unit?.[0]?.baseUnit,
                    Low:
                        ing.threshold?.lowInBase /
                        thresholdUnit?.conversionRate,
                    Critical:
                        ing.threshold?.criticalInBase /
                        thresholdUnit?.conversionRate,
                    ThresholdUnit: thresholdUnit?.unitName,
                });
            }
            break;
        }

        case "menu-item": {

            const itemCursor = MenuItem.find(
                { "tenant.tenantId": tenant.tenantId },
                { itemName: 1, price: 1 }
            ).lean().cursor();

            for await (const item of itemCursor) {
                await writeCsvRow(csvStream, {
                    ItemName: item.itemName,
                    Price: item.price,
                });
            }
            break;
        }

        case "recipe": {

            const recipeCursor = Recipe.find(
                { "tenant.tenantId": tenant.tenantId },
                { item: 1, recipeItems: 1 }
            ).lean().cursor();

            for await (const recipe of recipeCursor) {
                for (const item of recipe.recipeItems || []) {
                    await writeCsvRow(csvStream, {
                        ItemName: recipe.item?.itemName,
                        IngredientName: item.ingredientName,
                        Quantity: item.qty,
                        Unit: item.unit,
                    });
                }
            }

            break;
        }

        case "stock-movement": {

            const stockCursor = Stock.find(
                { "outlet.outletId": targetOutletId },
                {
                    masterIngredient: 1,
                    currentStockInBase: 1,
                    baseUnit: 1,
                    alertState: 1,
                }
            ).lean().cursor();

            const now = new Date();
            const formattedDate = now.toISOString().substring(0, 10);
            const timestamp = now.toISOString().substring(11, 19);

            for await (const stock of stockCursor) {
                await writeCsvRow(csvStream, {
                    IngredientName:
                        stock.masterIngredient?.ingredientMasterName,
                    Quantity: stock.currentStockInBase,
                    baseUnit: stock.baseUnit,
                    AlertState: stock.alertState,
                    time: timestamp,
                    date: formattedDate,
                });
            }
            break;
        }

        default:
            throw new ApiError(400, "Invalid export type");
    }

    csvStream.end();
});


export const getTemplate = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { tenant, outlet } = req.user;

    if (!tenant?.tenantId) {
        throw new ApiError(400, "Tenant ID required");
    }

    await validateTenant(tenant.tenantId);

    let targetOutletId = outlet?.outletId;

    if (type === "stock-movement") {
        if (!targetOutletId) {
            throw new ApiError(400, "Outlet ID required");
        }

        await validateOutlet(tenant.tenantId, targetOutletId);
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=template-${type}.csv`
    );

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    switch (type) {
        case "ingredient":
            if (req.user.role === "OUTLET_MANAGER") {
                throw new ApiError(
                    403,
                    "Only OUTLET_MANAGER can download stock template"
                );
            }
            csvStream.write({
                Name: "Example Ingredient",
                Units: "kg $$ gm",
                BaseUnit: "gm",
                Low: "10",
                Critical: "5",
                ThresholdUnit: "kg",
            });
            break;

        case "menu-item":
            if (req.user.role === "OUTLET_MANAGER") {
                throw new ApiError(
                    403,
                    "Only OUTLET_MANAGER can download stock template"
                );
            }
            csvStream.write({
                ItemName: "Burger",
                Price: "150",
                IngredientName: "Cheese",
                Quantity: "20",
                Unit: "gm",
            });
            csvStream.write({
                ItemName: "Burger",
                Price: "150",
                IngredientName: "Bun",
                Quantity: "1",
                Unit: "piece",
            });
            csvStream.write({
                ItemName: "Plain Tea",
                Price: "30",
                IngredientName: "",
                Quantity: "",
                Unit: "",
            });
            break;

        case "recipe":
            if (req.user.role === "OUTLET_MANAGER") {
                throw new ApiError(
                    403,
                    "Only OUTLET_MANAGER can download stock template"
                );
            }
            csvStream.write({
                ItemName: "Burger",
                IngredientName: "Cheese",
                Quantity: "20",
                Unit: "gm",
            });
            break;

        case "stock-movement":
            csvStream.write({
                IngredientName: "Tomato",
                Quantity: "10",
                Unit: "kg",
                Reason: "PURCHASE",
                Price: "30",
            });

            csvStream.write({
                IngredientName: "Tomato",
                Quantity: "2",
                Unit: "kg",
                Reason: "POSITIVE_ADJUSTMENT",
                Price: "",
            });

            csvStream.write({
                IngredientName: "Tomato",
                Quantity: "1",
                Unit: "kg",
                Reason: "NEGATIVE_ADJUSTMENT",
                Price: "",
            });

            break;

        default:
            throw new ApiError(400, "Invalid template type");
    }

    csvStream.end();
});

