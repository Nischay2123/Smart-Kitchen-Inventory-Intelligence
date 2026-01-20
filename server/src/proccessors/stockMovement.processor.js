import StockMovement from "../models/stockMovement.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Stock from "../models/stock.model.js";
import {emitEvent} from "../workers/socket.js"

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

    const result = await StockMovement.findOneAndUpdate(

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
      { 
        new:true,
        upsert: true,
        rawResult: true,
      }
    );
    // console.log(result);
    
    if (!result.lastErrorObject?.upserted) {
      const room = `tenant:${tenant.tenantId}:outlet:${outlet.outletId}`;
      console.log("Worker");
      
      emitEvent(room, "STOCK_MOVEMENT_CREATED", result.toObject());  
    }

  }
};
