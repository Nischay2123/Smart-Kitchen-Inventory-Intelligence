
import mongoose from "mongoose";

import { buildStockRequirement } from "../services/stockRequirement.service.js";
import { validateStock } from "../services/stockValidator.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import Stock from "../models/stock.model.js";
import Sale from "../models/sale.model.js";
import Recipe from "../models/recipes.model.js";
import QueueFail from "../models/queueFail.model.js";

import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";

import { orderQueue } from "../queues/order.queue.js";
import { paginate } from "../utils/pagination.js";
import { cacheService } from "../services/cache.service.js";


const createPendingSale = async ({ tenant, outlet, items, createdAt }) => {
  return Sale.create({
    tenant,
    outlet,
    state: "PENDING",
    createdAt: createdAt || new Date(),
    items: items.map(i => ({
      itemId: i.itemId,
      itemName: i.itemName,
      qty: i.qty,
      totalAmount: 0,
      makingCost: 0,
      cancelIngredientDetails: [],
    })),
  });
};

const loadRecipeMap = async ({ tenant, items }) => {
  const itemIds = items.map((i) => String(i.itemId));
  const uniqueItemIds = [...new Set(itemIds)];

  const recipeMap = new Map();
  const missingItemIds = [];

  const cacheKeys = uniqueItemIds.map((id) =>
    cacheService.generateKey("recipe", tenant.tenantId, id)
  );

  const cachedRecipes = await cacheService.mget(cacheKeys);

  cachedRecipes.forEach((recipe, index) => {
    if (recipe) {
      recipeMap.set(uniqueItemIds[index], recipe);
    } else {
      missingItemIds.push(uniqueItemIds[index]);
    }
  });

  if (missingItemIds.length > 0) {
    const dbRecipes = await Recipe.find({
      "tenant.tenantId": tenant.tenantId,
      "item.itemId": { $in: missingItemIds },
    }).lean();

    for (const recipe of dbRecipes) {
      const itemId = String(recipe.item.itemId);
      recipeMap.set(itemId, recipe);

      const key = cacheService.generateKey("recipe", tenant.tenantId, itemId);
      await cacheService.set(key, recipe);
    }
  }

  return recipeMap;
};

const buildItemFailureMap = (items, recipeMap, failedIngredients) => {
  const map = new Map();

  for (const item of items) {
    const recipe = recipeMap.get(String(item.itemId));
    if (!recipe) continue;

    for (const ing of recipe.recipeItems) {
      const fail = failedIngredients.find(
        f =>
          String(f.ingredientMasterId) ===
          String(ing.ingredientMasterId)
      );

      if (fail) {
        if (!map.has(String(item.itemId))) {
          map.set(String(item.itemId), []);
        }

        map.get(String(item.itemId)).push({
          ingredientMasterId: fail.ingredientMasterId,
          ingredientMasterName:
            fail.ingredientMasterName || "Unknown",
          requiredQty: fail.required,
          availableStock: fail.available,
          issue: "INSUFFICIENT_STOCK",
        });
      }
    }
  }

  return map;
};


const cancelSaleAndRespond = async ({
  res,
  saleId,
  reason,
  items,
  itemFailureMap = new Map(),
}) => {
  await Sale.updateOne(
    { _id: saleId },
    {
      $set: {
        state: "CANCELED",
        reason,
        items: items.map(i => ({
          itemId: i.itemId,
          itemName: i.itemName,
          qty: i.qty,
          totalAmount: 0,
          makingCost: 0,
          cancelIngredientDetails:
            itemFailureMap.get(String(i.itemId)) || [],
        })),
      },
    }
  );

  return res.status(400).json({
    saleId,
    state: "CANCELED",
    reason,
  });
};

const MAX_RETRIES = 5;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const deductStockWithTransaction = async ({
  requirementList,
  outlet,
}) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const bulkOps = requirementList.map(req => ({
        updateOne: {
          filter: {
            "outlet.outletId": outlet.outletId,
            "masterIngredient.ingredientMasterId":
              req.ingredientMasterId,
            currentStockInBase: { $gte: req.requiredBaseQty },
          },
          update: {
            $inc: { currentStockInBase: -req.requiredBaseQty },
          },
        },
      }));

      const result = await Stock.bulkWrite(bulkOps, { session });

      if (result.matchedCount !== requirementList.length) {
        throw new Error("STOCK_CHANGED");
      }

      await session.commitTransaction();
      session.endSession();
      return;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      const isWriteConflict =
        err.message?.includes("Write conflict");

      if (isWriteConflict && attempt < MAX_RETRIES) {
        const backoff = 20 + Math.random() * 80;
        console.log(
          `Retrying stock deduction (${attempt}) after ${backoff.toFixed(0)}ms`
        );

        await sleep(backoff);
        continue;
      }

      throw new ApiError(409, "STOCK_CHANGED");
    }
  }
};

export const createSale = asyncHandler(async (req, res) => {
  const { items, tenant, outlet, createdAt } = req.body;

  const saleRecord = await createPendingSale({ tenant, outlet, items, createdAt });

  const recipeMap = await loadRecipeMap({ tenant, items });

  const { requirementList, recipeErrors } =
    await buildStockRequirement(items, recipeMap);

  if (recipeErrors.length > 0) {
    return cancelSaleAndRespond({
      res,
      saleId: saleRecord._id,
      reason: "RECIPE_NOT_FOUND",
      items,
    });
  }

  const validation = await validateStock(
    requirementList,
    outlet.outletId
  );

  if (!validation.isValid) {
    const itemFailureMap =
      buildItemFailureMap(items, recipeMap, validation.failed);

    return cancelSaleAndRespond({
      res,
      saleId: saleRecord._id,
      reason: "INSUFFICIENT_STOCK",
      items,
      itemFailureMap,
    });
  }

  try {
    await deductStockWithTransaction({
      requirementList,
      outlet,
      saleId: saleRecord._id,
    });
  } catch (error) {
    return cancelSaleAndRespond({
      res,
      saleId: saleRecord._id,
      reason: "STOCK_CHANGED",
      items,
    });
  }

  // console.log(saleRecord.createdAt);

  try {
    await orderQueue.add("sale.confirmed", {
      orderId: saleRecord._id,
      tenant,
      outlet,
      items,
      requirementList,
      state: "CONFIRMED",
      createdAt: saleRecord.createdAt,
    });
  } catch (err) {
    await QueueFail.create({
      eventType: "sale.confirmed",
      payload: {
        orderId: saleRecord._id,
        tenant,
        outlet,
        items,
        requirementList,
        state: "CONFIRMED",
        createdAt: saleRecord.createdAt,
        nextRetryAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      lastError: err.message,
    });
  }
  return res.status(201).json({
    saleId: saleRecord._id,
    state: "CONFIRMED",
  });
});

export const getAllSales = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Access denied");
  }

  const { fromDate, toDate, page = 1, limit = 10 } = req.query;


  const filter = {
    "tenant.tenantId": req.user.tenant.tenantId,
    "outlet.outletId": req.user.outlet.outletId,
  };

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  // const sales = await Sale.find(filter).sort({ createdAt: -1 });
  const { data: saleRecords, meta } = await paginate(Sale, filter, {
    page,
    limit,
    sort: { createdAt: -1 }
  })

  return res.status(200).json(
    new ApiResoponse(200, {
      saleRecords,
      pagination: meta
    }, "Sales fetched")
  );
});




