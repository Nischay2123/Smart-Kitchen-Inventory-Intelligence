import Stock from "../models/stock.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllStockDetails = asyncHandler(async (req, res) => {
  // 1️⃣ Authorization
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(
      403,
      "Only OUTLET_MANAGER can view stock details"
    );
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;

  if (!tenantContext?.tenantId || !outletContext?.outletId) {
    throw new ApiError(
      400,
      "User is not associated with tenant or outlet"
    );
  }

  // 2️⃣ Fetch all ingredient masters (tenant-level)
  const ingredients = await IngredientMaster.find({
    "tenant.tenantId": tenantContext.tenantId,
  });

  // 3️⃣ Fetch all stock for this outlet
  const stocks = await Stock.find({
    "tenant.tenantId": tenantContext.tenantId,
    "outlet.outletId": outletContext.outletId,
  });

  // 4️⃣ Build stock map (ingredientMasterId → stock)
  const stockMap = new Map(
    stocks.map(s => [
      s.masterIngredient.ingredientMasterId.toString(),
      s,
    ])
  );

  // 5️⃣ Merge ingredient list with stock
  const result = ingredients.map(ingredient => {
    const stock = stockMap.get(ingredient._id.toString());

    // Stock not initialized yet
    if (!stock) {
      return {
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        baseUnit: ingredient.unit.baseUnit,
        currentStockInBase: 0,
        alertState: "NOT_INITIALIZED",
        threshold: null,
        action: "INITIALIZE_STOCK",
      };
    }

    return {
      ingredientId: ingredient._id,
      ingredientName: stock.masterIngredient.ingredientName,
      baseUnit: stock.baseUnit,
      currentStockInBase: stock.currentStockInBase,
      alertState: stock.alertState,
      threshold: stock.threshold,
      action:
        stock.alertState === "CRITICAL"
          ? "URGENT_RESTOCK"
          : stock.alertState === "LOW"
          ? "RESTOCK"
          : "NONE",
    };
  });

  return res.status(200).json(
    new ApiResoponse(
      200,
      result,
      "Stock details fetched successfully"
    )
  );
});
