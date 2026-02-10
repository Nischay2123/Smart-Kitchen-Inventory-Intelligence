import Stock from "../models/stock.model.js";

export const validateStock = async (requirementList, outletId) => {
  const result = {
    isValid: true,
    failed: [],
    stockMap: new Map(), 
  };

  if (!requirementList.length) {
    return result;
  }

  const ingredientIds = requirementList.map(r => r.ingredientMasterId);

  const stocks = await Stock.find({
    "outlet.outletId": outletId,
    "masterIngredient.ingredientMasterId": { $in: ingredientIds },
  }).lean();

  stocks.forEach(stock => {
    result.stockMap.set(
      String(stock.masterIngredient.ingredientMasterId),
      stock
    );
  });
  // console.log(requirementList);
  
  for (const req of requirementList) {
    const stock = result.stockMap.get(
      String(req.ingredientMasterId)
    );

    if (!stock) {
      result.isValid = false;

      result.failed.push({
        ingredientMasterId: req.ingredientMasterId,
        ingredientMasterName: req.ingredientName,
        required: req.requiredBaseQty,
        available: 0,
        issue: "INGREDIENT_NOT_FOUND",
      });

      continue;
    }

    if (stock.currentStockInBase < req.requiredBaseQty) {
      result.isValid = false;

      result.failed.push({
        ingredientMasterId: req.ingredientMasterId,
        ingredientMasterName:
          stock.masterIngredient.ingredientMasterName,
        required: req.requiredBaseQty,
        available: stock.currentStockInBase,
        issue: "INSUFFICIENT_STOCK",
      });
    }
  }

  return result;
};
