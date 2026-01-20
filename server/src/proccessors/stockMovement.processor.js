import StockMovement from "../models/stockMovement.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Stock from "../models/stock.model.js";

export const processStockMovement = async (data) => {

  const {
    requestId,
    requirementList,
    tenant,
    outlet
  } = data;
  console.log("processStockMovement",requestId);
  
  for (const r of requirementList) {

    const ingredient = await IngredientMaster.findById(
      r.ingredientMasterId
    ).lean();

    if (!ingredient) {
      throw new Error("INGREDIENT_NOT_FOUND");
    }

    const stock = await Stock.findOne({
      "outlet.outletId": outlet.outletId,
      "masterIngredient.ingredientMasterId": r.ingredientMasterId,
    }).lean();

    await StockMovement.updateOne(

      {
        orderId: requestId,
        "ingredient.ingredientMasterId": r.ingredientMasterId,
        reason: "ORDER",
      },

      {
        $setOnInsert: {

          orderId: requestId,

          tenant: {
            tenantId: tenant.tenantId,
            tenantName: tenant.tenantName,
          },

          outlet: {
            outletId: outlet.outletId,
            outletName: outlet.outletName,
          },

          ingredient: {
            ingredientMasterId: r.ingredientMasterId,
            ingredientMasterName: ingredient.name,
          },

          quantity: r.requiredBaseQty,

          unit: ingredient.unit.baseUnit,

          reason: "ORDER",

          stockId: stock?._id || null,
        },
      },

      { upsert: true }
    );
  }
};
