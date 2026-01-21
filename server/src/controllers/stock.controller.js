import Stock from "../models/stock.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllStockDetails = asyncHandler(async (req, res) => {
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

  const ingredients = await IngredientMaster.find({
    "tenant.tenantId": tenantContext.tenantId,
  });

  const stocks = await Stock.find({
    "tenant.tenantId": tenantContext.tenantId,
    "outlet.outletId": outletContext.outletId,
  });

  const stockMap = new Map(
    stocks.map(s => [
      s.masterIngredient.ingredientMasterId.toString(),
      s,
    ])
  );
  // console.log(ingredients);
  
  const result = ingredients.map(ingredient => {
    const stock = stockMap.get(ingredient._id.toString());

    if (!stock) {
      return {
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        baseUnit: ingredient.unit[0].baseUnit,
        unit: ingredient.unit,
        currentStockInBase: 0,
        alertState: "NOT_INITIALIZED",
      };
    }

    return {
      ingredientId: ingredient._id,
      ingredientName: ingredient.name,
      baseUnit: stock.baseUnit,
      unit:ingredient.unit,
      currentStockInBase: stock.currentStockInBase,
      alertState: stock.alertState,
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
