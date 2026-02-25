
import mongoose from "mongoose";

import { buildStockRequirement } from "../services/stockRequirement.service.js";
import { validateStock } from "../services/stockValidator.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import Stock from "../models/stock.model.js";
import Sale from "../models/sale.model.js";
import Recipe from "../models/recipes.model.js";
import QueueFail from "../models/queueFail.model.js";
import Tenant from "../models/tenant.model.js";
import Outlet from "../models/outlet.model.js";

import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";

import { orderQueue } from "../queues/order.queue.js";
import { paginate } from "../utils/pagination.js";
import { cacheService } from "../services/cache.service.js";

const validateTenant = async (tenantId) => {
  // console.log("tenant",tenantId);

  const tenant = await Tenant.findOne({ _id: tenantId }).lean();
  if (!tenant) throw new ApiError(404, "TENANT_NOT_FOUND");
  return tenant;
};

const validateOutlet = async (tenantId, outletId) => {
  // console.log("outlet",tenantId, outletId);

  const outlet = await Outlet.findOne({
    "tenant.tenantId": tenantId,
    _id: outletId,
  }).lean();

  if (!outlet) throw new ApiError(404, "OUTLET_NOT_FOUND");
  return outlet;
};

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

  let cachedRecipes = [];
  try {
    const cacheKeys = uniqueItemIds.map((id) =>
      cacheService.generateKey("recipe", tenant.tenantId, id)
    );

    cachedRecipes = await cacheService.mget(cacheKeys);
  } catch (err) {
    console.error("Cache Read Error:", err);
    cachedRecipes = new Array(uniqueItemIds.length).fill(null);
  }

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
      cacheService.set(key, recipe).catch(err => console.error("Cache Write Error:", err));
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
    session.startTransaction();

    try {
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
      return;
    } catch (err) {
      await session.abortTransaction();

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
    } finally {
      session.endSession();
    }
  }
};

export const createSale = asyncHandler(async (req, res) => {
  const { items, tenant, outlet, createdAt } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "items array is required and cannot be empty");
  }
  if (!tenant || !tenant.tenantId) {
    throw new ApiError(400, "tenant with tenantId is required");
  }
  if (!outlet || !outlet.outletId) {
    throw new ApiError(400, "outlet with outletId is required");
  }

  await validateTenant(tenant.tenantId);
  // console.log("create sale",tenant , outlet);

  await validateOutlet(tenant.tenantId, outlet.outletId);

  const saleRecord = await createPendingSale({ tenant, outlet, items, createdAt });

  let recipeMap;
  let requirementList;

  try {
    recipeMap = await loadRecipeMap({ tenant, items });

    const stockRequirements = await buildStockRequirement(items, recipeMap);
    requirementList = stockRequirements.requirementList;
    const recipeErrors = stockRequirements.recipeErrors;

    if (recipeErrors.length > 0) {
      throw new Error("RECIPE_NOT_FOUND");
    }

    await deductStockWithTransaction({
      requirementList,
      outlet,
    });

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
      console.error("Queue Add Error:", err);
      try {
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
      } catch (dbErr) {
        console.error("CRITICAL: QueueFail DB Insert Failed:", dbErr);
      }
    }

    return res.status(201).json(new ApiResoponse(201, {
      saleId: saleRecord._id,
      state: "CONFIRMED",
    }, "Sale created successfully"));

  } catch (error) {
    let reason = error.message || "INTERNAL_SERVER_ERROR";
    let itemFailureMap = new Map();

    if (error.message === "STOCK_CHANGED" || error.statusCode === 409) {
      if (requirementList && recipeMap) {
        try {
          const validation = await validateStock(
            requirementList,
            outlet.outletId
          );

          if (!validation.isValid) {
            reason = "INSUFFICIENT_STOCK";
            itemFailureMap = buildItemFailureMap(items, recipeMap, validation.failed);
          } else {
            reason = "STOCK_CHANGED";
          }
        } catch (validationErr) {
          console.error("Stock Validation Error during rollback diagnosis:", validationErr);
          reason = "STOCK_CHANGED";
        }
      }
    }

    await cancelSaleAndRespond({
      res,
      saleId: saleRecord._id,
      reason,
      items,
      itemFailureMap,
    });
    return;
  }
});

export const getAllSales = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Access denied");
  }

  const { fromDate, toDate, page = 1, limit = 10, state } = req.query;


  const filter = {
    "tenant.tenantId": req.user.tenant.tenantId,
    "outlet.outletId": req.user.outlet.outletId,
  };
  console.log(state);

  if (state) {
    filter.state = state;
  }

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




