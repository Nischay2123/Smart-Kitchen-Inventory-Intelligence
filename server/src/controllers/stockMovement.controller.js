import mongoose from "mongoose";
import Stock from "../models/stock.model.js";
import StockMovement from "../models/stockMovement.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// export const createStockMovement = asyncHandler(async (req, res) => {
//   const session = await mongoose.startSession()
//   session.startTransaction()

//   try {
//     const {
//       ingredientMasterId,
//       quantity,
//       reason,
//       purchasePricePerUnit,
//       unitId
//     } = req.body
//     console.log(ingredientMasterId, quantity , reason ,purchasePricePerUnit);
    
//     if (
//       !ingredientMasterId ||
//       typeof quantity !== "number" ||
//       quantity <= 0 ||
//       !reason
//     ) {
//       throw new ApiError(
//         400,
//         "ingredientMasterId, quantity (>0) and reason are required"
//       )
//     }

//     const VALID_REASONS = [
//       "PURCHASE",
//       "POSITIVE_ADJUSTMENT",
//       "NEGATIVE_ADJUSTMENT",
//     ]

//     if (!VALID_REASONS.includes(reason)) {
//       throw new ApiError(400, "Invalid reason")
//     }

//     if (reason === "PURCHASE" && !purchasePricePerUnit) {
//       throw new ApiError(400, "purchasePrice is required for PURCHASE")
//     }

//     const tenantContext = req.user.tenant
//     const outletContext = req.user.outlet

//     if (!tenantContext?.tenantId || !outletContext?.outletId) {
//       throw new ApiError(400, "User not linked to tenant or outlet")
//     }

//     const ingredient = await IngredientMaster.findOne({
//       _id: ingredientMasterId,
//       "tenant.tenantId": tenantContext.tenantId,
//     }).session(session)

//     if (!ingredient) {
//       throw new ApiError(404, "Ingredient not found")
//     }

//     const conversionRate = ingredient.unit.conversionRate
//     const quantityInBase = quantity * conversionRate

//     const POSITIVE_REASONS = ["PURCHASE", "POSITIVE_ADJUSTMENT"]
//     const signedQtyInBase = POSITIVE_REASONS.includes(reason)
//       ? quantityInBase
//       : -quantityInBase

//     let stock = await Stock.findOne({
//       "tenant.tenantId": tenantContext.tenantId,
//       "outlet.outletId": outletContext.outletId,
//       "masterIngredient.ingredientMasterId": ingredient._id,
//     }).session(session)

//     if (!stock) {
//       if (signedQtyInBase < 0) {
//         throw new ApiError(
//           400,
//           "Cannot deduct stock before initialization"
//         )
//       }

//       const unitCost =
//         reason === "PURCHASE"
//           ? purchasePrice / conversionRate
//           : 0

//       stock = await Stock.create(
//         [
//           {
//             tenant: tenantContext,
//             outlet: outletContext,
//             masterIngredient: {
//               ingredientMasterId: ingredient._id,
//               ingredientMasterName: ingredient.name,
//             },
//             baseUnit: ingredient.unit.baseUnit,
//             currentStockInBase: quantityInBase,
//             unitCost,
//             alertState: "OK",
//           },
//         ],
//         { session }
//       )

//       stock = stock[0]
//     } else {
//       const newQty =
//         stock.currentStockInBase + signedQtyInBase

//       if (newQty < 0) {
//         throw new ApiError(400, "Stock cannot go below zero")
//       }

//       if (reason === "PURCHASE") {
//         const oldValue =
//           stock.currentStockInBase * stock.unitCost

//         const newValue =
//           quantityInBase *
//           (purchasePrice / conversionRate)

//         stock.unitCost =
//           (oldValue + newValue) / newQty
//       }

//       stock.currentStockInBase = newQty
//     }

//     if (
//       stock.currentStockInBase <=
//       ingredient.threshold.criticalInBase
//     ) {
//       stock.alertState = "CRITICAL"
//     } else if (
//       stock.currentStockInBase <= ingredient.threshold.lowInBase
//     ) {
//       stock.alertState = "LOW"
//     } else {
//       stock.alertState = "OK"
//     }

//     await stock.save({ session })

//     const movement = await StockMovement.create(
//       [
//         {
//           tenant: tenantContext,
//           outlet: outletContext,
//           ingredient: {
//             ingredientMasterId: ingredient._id,
//             ingredientMasterName: ingredient.name,
//           },
//           quantity,
//           unit: ingredient.unit.unitName,
//           reason,
//           orderId:
//             reason === "ORDER" ? orderId || null : null,
//           stockId: stock._id,
//           purchasePriceInUnit:purchasePrice
//         },
//       ],
//       { session }
//     )

//     await session.commitTransaction()
//     session.endSession()

//     const io = req.app.get("io")
//     io.to(
//       `tenant:${tenantContext.tenantId}:outlet:${outletContext.outletId}`
//     ).emit("stock_updated", {
//       ingredientId: ingredient._id,
//       currentStockInBase: stock.currentStockInBase,
//       alertState: stock.alertState,
//     })

//     return res.status(201).json(
//       new ApiResoponse(
//         201,
//         { stock, movement: movement[0] },
//         "Stock movement created successfully"
//       )
//     )
//   } catch (error) {
//     await session.abortTransaction()
//     session.endSession()
//     throw error
//   }
// })

export const createStockMovement = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      ingredientMasterId,
      quantity,
      reason,
      purchasePricePerUnit,
      unitId,
    } = req.body;
    console.log({
      ingredientMasterId,
      quantity,
      reason,
      purchasePricePerUnit,
      unitId,
    });
    
    if (
      !ingredientMasterId ||
      !unitId ||
      typeof quantity !== "number" ||
      quantity <= 0 ||
      !reason
    ) {
      throw new ApiError(
        400,
        "ingredientMasterId, unitId, quantity (>0) and reason are required"
      );
    }

    const VALID_REASONS = [
      "PURCHASE",
      "POSITIVE_ADJUSTMENT",
      "NEGATIVE_ADJUSTMENT",
    ];

    if (!VALID_REASONS.includes(reason)) {
      throw new ApiError(400, "Invalid reason");
    }

    if (reason === "PURCHASE" && !purchasePricePerUnit) {
      throw new ApiError(
        400,
        "purchasePricePerUnit is required for PURCHASE"
      );
    }

    const tenantContext = req.user.tenant;
    const outletContext = req.user.outlet;

    if (!tenantContext?.tenantId || !outletContext?.outletId) {
      throw new ApiError(400, "User not linked to tenant or outlet");
    }

    /* ---------------- Ingredient Validation ---------------- */
    const ingredient = await IngredientMaster.findOne({
      _id: ingredientMasterId,
      "tenant.tenantId": tenantContext.tenantId,
    }).session(session);

    if (!ingredient) {
      throw new ApiError(404, "Ingredient not found");
    }

    /* ---------------- Unit Validation ---------------- */
    console.log(ingredient);
    
    const unit = ingredient.unit.find(
      (u) => u.unitId.toString() === unitId
    );

    if (!unit) {
      throw new ApiError(400, "Invalid unit for this ingredient");
    }

    const conversionRate = unit.conversionRate;
    const quantityInBase = quantity * conversionRate;

    /* ---------------- Signed Quantity ---------------- */
    const POSITIVE_REASONS = ["PURCHASE", "POSITIVE_ADJUSTMENT"];
    const signedQtyInBase = POSITIVE_REASONS.includes(reason)
      ? quantityInBase
      : -quantityInBase;

    /* ---------------- Fetch / Init Stock ---------------- */
    let stock = await Stock.findOne({
      "tenant.tenantId": tenantContext.tenantId,
      "outlet.outletId": outletContext.outletId,
      "masterIngredient.ingredientMasterId": ingredient._id,
    }).session(session);

    if (!stock) {
      if (signedQtyInBase < 0) {
        throw new ApiError(
          400,
          "Cannot deduct stock before initialization"
        );
      }

      const unitCostInBase =
        reason === "PURCHASE"
          ? purchasePricePerUnit / conversionRate
          : 0;

      stock = await Stock.create(
        [
          {
            tenant: tenantContext,
            outlet: outletContext,
            masterIngredient: {
              ingredientMasterId: ingredient._id,
              ingredientMasterName: ingredient.name,
            },
            baseUnit: unit.baseUnit,
            currentStockInBase: quantityInBase,
            unitCost: unitCostInBase,
            alertState: "OK",
          },
        ],
        { session }
      );

      stock = stock[0];
    } else {
      const newQty =
        stock.currentStockInBase + signedQtyInBase;

      if (newQty < 0) {
        throw new ApiError(400, "Stock cannot go below zero");
      }

      if (reason === "PURCHASE") {
        const oldValue =
          stock.currentStockInBase * stock.unitCost;

        const newValue =
          quantityInBase *
          (purchasePricePerUnit / conversionRate);

        stock.unitCost =
          (oldValue + newValue) / newQty;
      }

      stock.currentStockInBase = newQty;
    }

    /* ---------------- Alert State ---------------- */
    if (
      stock.currentStockInBase <=
      ingredient.threshold.criticalInBase
    ) {
      stock.alertState = "CRITICAL";
    } else if (
      stock.currentStockInBase <=
      ingredient.threshold.lowInBase
    ) {
      stock.alertState = "LOW";
    } else {
      stock.alertState = "OK";
    }

    await stock.save({ session });

    console.log(purchasePricePerUnit);
    

    /* ---------------- Stock Movement ---------------- */
    const movement = await StockMovement.create(
      [
        {
          tenant: tenantContext,
          outlet: outletContext,
          ingredient: {
            ingredientMasterId: ingredient._id,
            ingredientMasterName: ingredient.name,
          },
          quantity,
          unit: unit.unitName,               
          reason,
          stockId: stock._id,
          purchasePriceInUnit:
            reason === "PURCHASE"
              ? purchasePricePerUnit
              : undefined,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    /* ---------------- Realtime Emit ---------------- */
    const io = req.app.get("io");
    io.to(
      `tenant:${tenantContext.tenantId}:outlet:${outletContext.outletId}`
    ).emit("stock_updated", {
      ingredientId: ingredient._id,
      currentStockInBase: stock.currentStockInBase,
      alertState: stock.alertState,
    });

    return res.status(201).json(
      new ApiResoponse(
        201,
        { stock, movement: movement[0] },
        "Stock movement created successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction(); 
    session.endSession();
    throw error;
  }
});




export const getAllStockMovementsForOrders = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Access denied");
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;

  const { ingredientMasterId, fromDate, toDate } = req.query;

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
    "outlet.outletId": outletContext.outletId,
    reason: { $eq: "ORDER" },
  };

  if (ingredientMasterId) {
    filter["ingredient.ingredientMasterId"] = ingredientMasterId;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(200, movements, "Stock movements fetched")
  );
});
export const getAllStockMovementsExceptOrders = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Access denied");
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;

  const { ingredientMasterId, fromDate, toDate } = req.query;

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
    "outlet.outletId": outletContext.outletId,
    reason: { $ne: "ORDER" },
  };

  if (ingredientMasterId) {
    filter["ingredient.ingredientMasterId"] = ingredientMasterId;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(200, movements, "Stock movements fetched")
  );
});
