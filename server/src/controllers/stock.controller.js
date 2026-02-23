import Stock from "../models/stock.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../utils/pagination.js";

export const getAllStockDetails = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Only OUTLET_MANAGER can view stock details");
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;

  if (!tenantContext?.tenantId || !outletContext?.outletId) {
    throw new ApiError(400, "User is not associated with tenant or outlet");
  }

  const {
    page = 1,
    limit = 10,
    search = "",
    alertState,
  } = req.query;

  const tenantId = tenantContext.tenantId;
  const outletId = outletContext.outletId;

  const ingredientFilter = {
    "tenant.tenantId": tenantId,
  };

  if (alertState) {
    if (alertState === "NOT_INITIALIZED") {
      const initializedIds = await Stock.distinct(
        "masterIngredient.ingredientMasterId",
        {
          "tenant.tenantId": tenantId,
          "outlet.outletId": outletId,
        }
      );

      ingredientFilter._id = { $nin: initializedIds };
    } else {
      const matchingIds = await Stock.distinct(
        "masterIngredient.ingredientMasterId",
        {
          "tenant.tenantId": tenantId,
          "outlet.outletId": outletId,
          alertState,
        }
      );

      if (!matchingIds.length) {
        return res.status(200).json(
          new ApiResoponse(
            200,
            {
              stocks: [],
              pagination: {
                page: Number(page),
                limit: Number(limit),
                totalDocs: 0,
                totalPages: 0,
              },
            },
            "Stock details fetched successfully"
          )
        );
      }

      ingredientFilter._id = { $in: matchingIds };
    }
  }

  const { data: ingredients, meta } = await paginate(
    IngredientMaster,
    ingredientFilter,
    {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      sort: { name: 1 },
    }
  );

  const ingredientIds = ingredients.map((i) => i._id);

  const stocks = await Stock.find({
    "tenant.tenantId": tenantId,
    "outlet.outletId": outletId,
    "masterIngredient.ingredientMasterId": { $in: ingredientIds },
  }).select(
    "masterIngredient.ingredientMasterId baseUnit currentStockInBase alertState"
  );

  const stockMap = new Map(
    stocks.map((s) => [
      s.masterIngredient.ingredientMasterId.toString(),
      s,
    ])
  );

  const result = ingredients.map((ingredient) => {
    const stock = stockMap.get(ingredient._id.toString());

    if (!stock) {
      return {
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        baseUnit: ingredient.unit?.[0]?.baseUnit,
        unit: ingredient.unit,
        currentStockInBase: 0,
        alertState: "NOT_INITIALIZED",
        threshold: ingredient.threshold,
      };
    }

    return {
      ingredientId: ingredient._id,
      ingredientName: ingredient.name,
      baseUnit: stock.baseUnit,
      unit: ingredient.unit,
      currentStockInBase: stock.currentStockInBase,
      alertState: stock.alertState,
      threshold: ingredient.threshold,
    };
  });

  return res.status(200).json(
    new ApiResoponse(
      200,
      {
        stocks: result,
        pagination: meta,
      },
      "Stock details fetched successfully"
    )
  );
});