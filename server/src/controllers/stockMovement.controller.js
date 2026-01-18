import mongoose from "mongoose";
import Stock from "../models/stock.model.js";
import StockMovement from "../models/stockMovement.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createStockMovement = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      ingredientMasterId,
      delta,
      reason,
      referenceId,
      purchasePrice,
    } = req.body;

    // ───────────── VALIDATION ─────────────

    if (!ingredientMasterId || typeof delta !== "number" || !reason) {
      throw new ApiError(
        400,
        "ingredientMasterId, delta and reason are required"
      );
    }

    if (delta <= 0) {
      throw new ApiError(400, "delta must be greater than 0");
    }

    const VALID_REASONS = [
      "ORDER",
      "PURCHASE",
      "POSITIVE_ADJUSTMENT",
      "NEGATIVE_ADJUSTMENT",
    ];

    if (!VALID_REASONS.includes(reason)) {
      throw new ApiError(400, "Invalid reason type");
    }

    if (reason === "PURCHASE" && !purchasePrice) {
      throw new ApiError(
        400,
        "purchasePrice is required for PURCHASE reason"
      );
    }

    const tenantContext = req.user.tenant;
    const outletContext = req.user.outlet;

    if (!tenantContext?.tenantId || !outletContext?.outletId) {
      throw new ApiError(
        400,
        "User is not associated with tenant or outlet"
      );
    }

    // ───────────── GET INGREDIENT ─────────────

    const ingredient = await IngredientMaster.findOne({
      _id: ingredientMasterId,
      "tenant.tenantId": tenantContext.tenantId,
    }).session(session);

    if (!ingredient) {
      throw new ApiError(
        404,
        "Ingredient not found or does not belong to your tenant"
      );
    }

    const conversionRate = ingredient.unit.conversionRate;

    const POSITIVE_REASONS = ["PURCHASE", "POSITIVE_ADJUSTMENT"];
    const ORDER_REASONS = ["ORDER"];

    const isPositive = POSITIVE_REASONS.includes(reason);

    // ───────────── BASE UNIT CALCULATION ─────────────

    let deltaInBase = isPositive
      ? delta * conversionRate
      : -delta * conversionRate;

    // ───────────── FIND EXISTING STOCK ─────────────

    let stock = await Stock.findOne({
      "tenant.tenantId": tenantContext.tenantId,
      "outlet.outletId": outletContext.outletId,
      "masterIngredient.ingredientMasterId": ingredient._id,
    }).session(session);

    let calculatedUnitCost = 0;

    // ───────────── CREATE STOCK IF NOT EXISTS ─────────────

    if (!stock) {
      if (deltaInBase < 0) {
        throw new ApiError(
          400,
          "Cannot deduct stock before initialization"
        );
      }

      // Cost only matters on PURCHASE
      if (reason === "PURCHASE") {
        calculatedUnitCost = purchasePrice / deltaInBase;
      }

      stock = await Stock.create(
        [
          {
            tenant: {
              tenantId: tenantContext.tenantId,
              tenantName: tenantContext.tenantName,
            },

            outlet: {
              outletId: outletContext.outletId,
              outletName: outletContext.outletName,
            },

            masterIngredient: {
              ingredientMasterId: ingredient._id,
              ingredientMasterName: ingredient.name,
            },

            baseUnit: ingredient.unit.baseUnit,

            currentStockInBase: deltaInBase,

            unitCost: calculatedUnitCost,

            threshold: {
              low: 0,
              critical: 0,
            },

            alertState: "OK",
          },
        ],
        { session }
      );

      stock = stock[0];
    }

    // ───────────── UPDATE EXISTING STOCK ─────────────

    else {
      const newStockQty =
        stock.currentStockInBase + deltaInBase;

      if (newStockQty < 0) {
        throw new ApiError(
          400,
          "Stock cannot go below zero"
        );
      }

      // ───── WEIGHTED AVG COST (ONLY ON PURCHASE) ─────

      if (reason === "PURCHASE") {
        const oldValue =
          stock.currentStockInBase * stock.unitCost;

        const newValue = purchasePrice;

        const totalQty = newStockQty;

        calculatedUnitCost =
          (oldValue + newValue) / totalQty;

        stock.unitCost = calculatedUnitCost;
      }

      stock.currentStockInBase = newStockQty;
    }

    // ───────────── ALERT STATE ─────────────

    if (stock.currentStockInBase <= stock.threshold.critical) {
      stock.alertState = "CRITICAL";
    } else if (
      stock.currentStockInBase <= stock.threshold.low
    ) {
      stock.alertState = "LOW";
    } else {
      stock.alertState = "OK";
    }

    await stock.save({ session });

    // ───────────── REFERENCE ID LOGIC ─────────────

    let finalReferenceId = referenceId || null;

    if (
      !ORDER_REASONS.includes(reason) &&
      stock?._id &&
      !referenceId
    ) {
      finalReferenceId = stock._id;
    }

    // ───────────── CREATE MOVEMENT ─────────────

    const movement = await StockMovement.create(
      [
        {
          tenant: {
            tenantId: tenantContext.tenantId,
            tenantName: tenantContext.tenantName,
          },

          outlet: {
            outletId: outletContext.outletId,
            outletName: outletContext.outletName,
          },

          ingredient: {
            ingredientMasterId: ingredient._id,
            ingredientMasterName: ingredient.name,
          },

          deltaInBase,

          reason,

          referenceId: finalReferenceId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResoponse(
        201,
        {
          stock,
          movement: movement[0],
        },
        "Stock movement recorded successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});



export const getAllStockMovementsExceptOrders = asyncHandler(async (req, res) => {
  // 1️⃣ Authorization
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(
      403,
      "Only OUTLET_MANAGER can view stock movements"
    );
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;

  if (!tenantContext?.tenantId || !outletContext?.outletId) {
    throw new ApiError(
      400,
      "User is not associated with tenant or outlet"
    );
  }

  // 2️⃣ Optional filters
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

  // 3️⃣ Fetch movements
  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      movements,
      "Stock movements fetched successfully"
    )
  );
});
