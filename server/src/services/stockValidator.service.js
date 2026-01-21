import Stock from "../models/stock.model.js";

export const validateStock = async (
  requirementList,
  outletId
) => {

  const result = {
    isValid: true,
    failed: []
  };

  const ingredientIds =
    requirementList.map(r => r.ingredientMasterId);

  const stocks = await Stock.find({
    "outlet.outletId": outletId,
    "masterIngredient.ingredientMasterId": {
      $in: ingredientIds
    }
  }).lean();

  const stockMap = new Map();

  stocks.forEach(s => {
    stockMap.set(
      String(s.masterIngredient.ingredientMasterId),
      s
    );
  });

  for (const req of requirementList) {

    const stock = stockMap.get(
      String(req.ingredientMasterId)
    );

    if (!stock) {
      result.isValid = false;

      result.failed.push({
        ingredientMasterId: req.ingredientMasterId,
        required: req.requiredBaseQty,
        available: 0
      });

      continue;
    }

    if (stock.currentStockInBase < req.requiredBaseQty) {
      result.isValid = false;

      result.failed.push({
        ingredientMasterId: req.ingredientMasterId,
        ingredientMasterName: stock.masterIngredient.ingredientMasterName,
        required: req.requiredBaseQty,
        available: stock.currentStockInBase,
      });
    }
  }

  return result;
};
