import StockMovement from "../models/stockMovement.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Stock from "../models/stock.model.js";
import { emitEvent } from "../workers/socket.js";

export const processStockMovement = async (data) => {
  const { orderId, requirementList, tenant, outlet, createdAt,} = data;

  console.log("processStockMovement", orderId);
  console.log(createdAt);
  
  for (const r of requirementList) {
    const ingredient = await IngredientMaster
      .findById(r.ingredientMasterId)
      .select("name unit")
      .lean();

    if (!ingredient) {
      throw new Error("INGREDIENT_NOT_FOUND");
    }

    const stock = await Stock
      .findOne({
        "outlet.outletId": outlet.outletId,
        "masterIngredient.ingredientMasterId": r.ingredientMasterId,
      })
      .select("_id unitCost")
      .lean();

    const result = await StockMovement.findOneAndUpdate(
      {
        orderId,
        "ingredient.ingredientMasterId": r.ingredientMasterId,
        reason: "ORDER",
      },
      {
        $setOnInsert: {
          orderId,

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

          stockId: stock?._id ?? null,

          unitCost: stock?.unitCost ?? 0,

          createdAt: createdAt || new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        rawResult: true,
        timestamps: false,
      }
    );

    if (result.lastErrorObject?.upserted) {
      const room = `tenant:${tenant.tenantId}:outlet:${outlet.outletId}`;
      emitEvent(room, "STOCK_MOVEMENT_CREATED", result.value);
    }
  }
};
