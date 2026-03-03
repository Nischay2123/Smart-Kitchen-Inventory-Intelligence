import StockMovement from "../models/stockMovement.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Stock from "../models/stock.model.js";
import { emitEvent } from "../workers/socket.js";
import { cacheService } from "../services/cache.service.js";

export const processStockMovement = async (data) => {
  const { orderId, requirementList, tenant, outlet, createdAt } = data;

  try {
    const ingredientIds = [
      ...new Set(requirementList.map((r) => String(r.ingredientMasterId))),
    ];

    const ingredientMap = new Map();
    {
      const keys = ingredientIds.map((id) =>
        cacheService.generateKey("ingredient", tenant.tenantId, id)
      );
      let cached = [];
      try {
        cached = await cacheService.mget(keys);
      } catch {
        cached = new Array(ingredientIds.length).fill(null);
      }

      const missIds = [];
      cached.forEach((ing, i) => {
        if (ing) ingredientMap.set(ingredientIds[i], ing);
        else missIds.push(ingredientIds[i]);
      });

      if (missIds.length > 0) {
        const dbIngredients = await IngredientMaster.find({ _id: { $in: missIds } })
          .select("name unit")
          .lean();
        for (const ing of dbIngredients) {
          const id = String(ing._id);
          ingredientMap.set(id, ing);
          cacheService
            .set(cacheService.generateKey("ingredient", tenant.tenantId, id), ing)
            .catch((err) => console.error("Cache Write Error (ingredient):", err));
        }
      }
    }

    // ── 2. Stock: always fetch from DB (changes frequently) ───────────
    const dbStocks = await Stock.find({
      "outlet.outletId": outlet.outletId,
      "masterIngredient.ingredientMasterId": { $in: ingredientIds },
    })
      .select("_id unitCost masterIngredient")
      .lean();

    const stockMap = new Map(
      dbStocks.map((s) => [String(s.masterIngredient.ingredientMasterId), s])
    );

    for (const r of requirementList) {
      const ingredient = ingredientMap.get(String(r.ingredientMasterId));

      if (!ingredient) {
        throw new Error(
          `INGREDIENT_NOT_FOUND ingredient=${r.ingredientMasterId} order=${orderId}`
        );
      }

      const stock = stockMap.get(String(r.ingredientMasterId)) ?? null;

      const result = await StockMovement.findOneAndUpdate(
        {
          orderId,
          "ingredient.ingredientMasterId":
            r.ingredientMasterId,
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
              ingredientMasterId:
                r.ingredientMasterId,
              ingredientMasterName:
                ingredient.name,
            },
            quantity: r.requiredBaseQty,
            unit: ingredient.unit?.[0]?.baseUnit,
            reason: "ORDER",
            stockId: stock?._id ?? null,
            unitCost: stock?.unitCost ?? 0,
            createdAt: createdAt || new Date(),
          },
        },
        {
          new:true,
          upsert: true,
          rawResult: true,
          timestamps: false,
        }
      );

      if (result.lastErrorObject?.upserted) {
        try {
          const room = `tenant:${tenant.tenantId}:outlet:${outlet.outletId}`;
          emitEvent(
            room,
            "STOCK_MOVEMENT_CREATED",
            result.value
          );
        } catch (socketErr) {
          console.error(
            "Socket emit failed:",
            socketErr.message
          );
        }
      }
    }
  } catch (err) {
    console.error(
      `StockMovement processor failed for order=${orderId}`,
      err
    );

    throw err;
  }
};
