
import mongoose from "mongoose";

import { buildStockRequirement } from "../services/stockRequirement.service.js";
import { validateStock } from "../services/stockValidator.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import Stock from "../models/stock.model.js";
import Sale from "../models/sale.model.js";
import Recipe from "../models/recipes.model.js";

import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";

import { orderQueue } from "../queues/order.queue.js";

// export const createSale = asyncHandler(async (req, res) => {
//   const { items } = req.body;
//   const tenant = req.user.tenant;
//   const outlet = req.user.outlet;


//   const saleRecord = await Sale.create({
//     tenant,
//     outlet,
//     state: "PENDING",
//     items: items.map(i => ({
//       itemId: i.itemId,
//       itemName: i.itemName,
//       qty: i.qty,
//       totalAmount: 0,
//       makingCost: 0,
//       cancelIngredientDetails: [],
//     })),
//   });


//   const itemIds = items.map(i => i.itemId);

//   const recipes = await Recipe.find({
//     "tenant.tenantId": tenant.tenantId,
//     "item.itemId": { $in: itemIds },
//   }).lean()
//     ;
//   console.log(recipes);

//   const recipeMap = new Map(
//     recipes.map(r => [String(r.item.itemId), r])
//   );

//   const { requirementList, recipeErrors } =
//     await buildStockRequirement(items, recipeMap);

//   if (recipeErrors.length > 0) {
//     await Sale.updateOne(
//       { _id: saleRecord._id },
//       {
//         $set: {
//           state: "CANCELED",
//           reason: "RECIPE_NOT_FOUND",
//           items: items.map(i => ({
//             itemId: i.itemId,
//             itemName: i.itemName,
//             qty: i.qty,
//             totalAmount: 0,
//             makingCost: 0,
//             cancelIngredientDetails: [],
//           })),
//         },
//       }
//     );

//     return res.status(400).json({
//       saleId: saleRecord._id,
//       state: "CANCELED",
//       reason: "RECIPE_NOT_FOUND",
//     });
//   }
//   console.log("hello", requirementList);


//   const validation = await validateStock(
//     requirementList,
//     outlet.outletId
//   );

//   if (!validation.isValid) {
//     const itemFailureMap = new Map();

//     for (const item of items) {
//       const recipe = recipeMap.get(String(item.itemId));
//       if (!recipe) continue;

//       for (const ing of recipe.recipeItems) {
//         const fail = validation.failed.find(
//           f =>
//             String(f.ingredientMasterId) ===
//             String(ing.ingredientMasterId)
//         );

//         if (fail) {
//           if (!itemFailureMap.has(String(item.itemId))) {
//             itemFailureMap.set(String(item.itemId), []);
//           }

//           itemFailureMap.get(String(item.itemId)).push({
//             ingredientMasterId: fail.ingredientMasterId,
//             ingredientMasterName: fail.ingredientMasterName || "Unknown",
//             requiredQty: fail.required,
//             availableStock: fail.available,
//             issue: "INSUFFICIENT_STOCK",
//           });
//         }
//       }
//     }

//     await Sale.updateOne(
//       { _id: saleRecord._id },
//       {
//         $set: {
//           state: "CANCELED",
//           reason: "INSUFFICIENT_STOCK",
//           items: items.map(i => ({
//             itemId: i.itemId,
//             itemName: i.itemName,
//             qty: i.qty,
//             totalAmount: 0,
//             makingCost: 0,
//             cancelIngredientDetails:
//               itemFailureMap.get(String(i.itemId)) || [],
//           })),
//         },
//       }
//     );

//     return res.status(400).json({
//       saleId: saleRecord._id,
//       state: "CANCELED",
//       reason: "INSUFFICIENT_STOCK",
//     });
//   }

//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     for (const req of requirementList) {
//       const ok = await Stock.findOneAndUpdate(
//         {
//           "outlet.outletId": outlet.outletId,
//           "masterIngredient.ingredientMasterId": req.ingredientMasterId,
//           currentStockInBase: { $gte: req.requiredBaseQty },
//         },
//         {
//           $inc: { currentStockInBase: -req.requiredBaseQty },
//         },
//         { session }
//       );

//       if (!ok) throw new Error("STOCK_CHANGED");
//     }

//     await session.commitTransaction();
//     orderQueue.add("sale.confirmed", {
//       orderId: saleRecord._id,
//       tenant,
//       outlet,
//       items,
//       requirementList,
//       state: "CONFIRMED",
//     });


//   } catch (err) {
//     await session.abortTransaction();

//     await Sale.updateOne(
//       { _id: saleRecord._id },
//       {
//         $set: {
//           state: "CANCELED",
//           reason: "STOCK_CHANGED",
//         },
//       }
//     );

//     throw err;
//   } finally {
//     session.endSession();
//   }


//   return res.status(201).json({
//     saleId: saleRecord._id,
//     state: "CONFIRMED",
//   });
// });


const createPendingSale = async ({ tenant, outlet, items }) => {
  return Sale.create({
    tenant,
    outlet,
    state: "PENDING",
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
  const itemIds = items.map(i => i.itemId);

  const recipes = await Recipe.find({
    "tenant.tenantId": tenant.tenantId,
    "item.itemId": { $in: itemIds },
  }).lean();

  return new Map(
    recipes.map(r => [String(r.item.itemId), r])
  );
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


const deductStockWithTransaction = async ({
  requirementList,
  outlet,
  saleId,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    for (const req of requirementList) {
      const ok = await Stock.findOneAndUpdate(
        {
          "outlet.outletId": outlet.outletId,
          "masterIngredient.ingredientMasterId":
            req.ingredientMasterId,
          currentStockInBase: { $gte: req.requiredBaseQty },
        },
        { $inc: { currentStockInBase: -req.requiredBaseQty } },
        { session }
      );

      if (!ok) throw new Error("STOCK_CHANGED");
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();

    await Sale.updateOne(
      { _id: saleId },
      {
        $set: {
          state: "CANCELED",
          reason: "STOCK_CHANGED",
        },
      }
    );

    throw err;
  } finally {
    session.endSession();
  }
};


export const createSale = asyncHandler(async (req, res) => {
  const { items,tenant, outlet } = req.body;
  // const tenant = req.user.tenant;
  // const outlet = req.user.outlet;

  const saleRecord = await createPendingSale({ tenant, outlet, items });

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

  await deductStockWithTransaction({
    requirementList,
    outlet,
    saleId: saleRecord._id,
  });

  orderQueue.add("sale.confirmed", {
    orderId: saleRecord._id,
    tenant,
    outlet,
    items,
    requirementList,
    state: "CONFIRMED",
  });

  return res.status(201).json({
    saleId: saleRecord._id,
    state: "CONFIRMED",
  });
});

export const getAllSales = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Access denied");
  }

  const { fromDate, toDate } = req.query;

  const filter = {
    "tenant.tenantId": req.user.tenant.tenantId,
    "outlet.outletId": req.user.outlet.outletId,
  };

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const sales = await Sale.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(200, sales, "Sales fetched")
  );
});




