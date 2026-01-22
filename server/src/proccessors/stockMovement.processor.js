import StockMovement from "../models/stockMovement.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Stock from "../models/stock.model.js";
import {emitEvent} from "../workers/socket.js"

export const processStockMovement = async (data) => {

  const {
    orderId,
    requirementList,
    tenant,
    outlet
  } = data;
  console.log("processStockMovement",orderId);
  
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
    // console.log(ingredient.unit[0].baseUnit);
    
    const result = await StockMovement.findOneAndUpdate(

      {
        orderId: orderId,
        "ingredient.ingredientMasterId": r.ingredientMasterId,
        reason: "ORDER",
      },

      {
        $setOnInsert: {

          orderId: orderId,

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

          unit: ingredient.unit[0].baseUnit,

          reason: "ORDER",

          stockId: stock?._id || null,
        },
      },
      { 
        new:true,
        upsert: true,
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
