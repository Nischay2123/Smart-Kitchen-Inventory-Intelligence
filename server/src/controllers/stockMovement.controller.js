import mongoose from "mongoose";
import Stock from "../models/stock.model.js";
import StockMovement from "../models/stockMovement.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../utils/pagination.js";

const validatePayload = (req) => {
  const {
    ingredientMasterId,
    quantity,
    reason,
    purchasePricePerUnit,
    unitId,
  } = req.body;
  // console.log("validatePayload start");

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
  // console.log("validatePayload end");

  return {
    ingredientMasterId,
    quantity,
    reason,
    purchasePricePerUnit,
    unitId,
  };
};

const validateContext = (req) => {
  const tenant = req.user.tenant;
  const outlet = req.user.outlet;
  // console.log("validatePayload start");

  if (!tenant?.tenantId || !outlet?.outletId) {
    throw new ApiError(400, "User not linked to tenant or outlet");
  }
  // console.log("validatePayload start");

  return { tenant, outlet };
};

const validateIngredient = async ({
  ingredientMasterId,
  tenantId,
  session,
}) => {
  const ingredient = await IngredientMaster.findOne({
    _id: ingredientMasterId,
    "tenant.tenantId": tenantId,
  }).session(session);
  // console.log("validatePayload start");

  if (!ingredient) {
    throw new ApiError(404, "Ingredient not found");
  }

  // console.log("validatePayload start");

  return ingredient;
};

const validateUnit = (ingredient, unitId) => {
  const unit = ingredient.unit.find(
    (u) => u.unitId.toString() === unitId
  );

  if (!unit) {
    throw new ApiError(400, "Invalid unit for this ingredient");
  }
  // console.log("validatePayload start");

  return unit;
};

const calculateQuantities = ({ quantity, unit, reason }) => {
  // console.log("start");

  const conversionRate = unit.conversionRate;
  const quantityInBase = quantity * conversionRate;

  const POSITIVE_REASONS = [
    "PURCHASE",
    "POSITIVE_ADJUSTMENT",
  ];

  const signedQtyInBase = POSITIVE_REASONS.includes(
    reason
  )
    ? quantityInBase
    : -quantityInBase;
  // console.log("validatePayload start");

  return {
    conversionRate,
    quantityInBase,
    signedQtyInBase,
  };
};

const upsertStock = async ({
  ingredient,
  context,
  payload,
  calc,
  session,
  unit,
}) => {
  let stock = await Stock.findOne({
    "tenant.tenantId": context.tenant.tenantId,
    "outlet.outletId": context.outlet.outletId,
    "masterIngredient.ingredientMasterId":
      ingredient._id,
  }).session(session);

  if (!stock) {
    if (calc.signedQtyInBase < 0) {
      throw new ApiError(
        400,
        "Cannot deduct stock before initialization"
      );
    }

    const unitCostInBase =
      payload.reason === "PURCHASE"
        ? payload.purchasePricePerUnit /
        calc.conversionRate
        : 0;

    const [created] = await Stock.create(
      [
        {
          tenant: context.tenant,
          outlet: context.outlet,
          masterIngredient: {
            ingredientMasterId:
              ingredient._id,
            ingredientMasterName:
              ingredient.name,
          },
          baseUnit: unit.baseUnit,
          currentStockInBase:
            calc.quantityInBase,
          unitCost: unitCostInBase,
          alertState: "OK",
        },
      ],
      { session }
    );

    stock = created;
  } else {
    const newQty =
      stock.currentStockInBase +
      calc.signedQtyInBase;

    if (newQty < 0) {
      throw new ApiError(
        400,
        "Stock cannot go below zero"
      );
    }

    if (payload.reason === "PURCHASE") {
      const oldValue =
        stock.currentStockInBase *
        stock.unitCost;

      const newValue =
        calc.quantityInBase *
        (payload.purchasePricePerUnit /
          calc.conversionRate);

      stock.unitCost =
        (oldValue + newValue) / newQty;
    }

    stock.currentStockInBase = newQty;
  }
  // console.log("validatePayload start");

  applyAlertState(stock, ingredient);

  await stock.save({ session });

  return stock;
};

const applyAlertState = (stock, ingredient) => {
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
};

const createStockMovementFunction = async ({
  ingredient,
  unit,
  payload,
  context,
  stock,
  session,
}) => {
  const [movement] =
    await StockMovement.create(
      [
        {
          tenant: context.tenant,
          outlet: context.outlet,
          ingredient: {
            ingredientMasterId:
              ingredient._id,
            ingredientMasterName:
              ingredient.name,
          },
          quantity: payload.quantity,
          unit: unit.unitName,
          reason: payload.reason,
          stockId: stock._id,
          purchasePriceInUnit:
            payload.reason === "PURCHASE"
              ? payload.purchasePricePerUnit
              : undefined,
        },
      ],
      { session }
    );

  return movement;
};

const emitStockSocket = (
  req,
  context,
  ingredient,
  stock
) => {
  const io = req.app.get("io");

  io.to(
    `tenant:${context.tenant.tenantId}:outlet:${context.outlet.outletId}`
  ).emit("stock_updated", {
    ingredientId: ingredient._id,
    currentStockInBase:
      stock.currentStockInBase,
    alertState: stock.alertState,
  });
};

export const createStockMovement = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const payload = validatePayload(req);
    const context = validateContext(req);

    const ingredient = await validateIngredient({
      ingredientMasterId: payload.ingredientMasterId,
      tenantId: context.tenant.tenantId,
      session,
    });

    const unit = validateUnit(ingredient, payload.unitId);

    const calc = calculateQuantities({
      quantity: payload.quantity,
      unit,
      reason: payload.reason,
    });

    const stock = await upsertStock({
      ingredient,
      context,
      payload,
      calc,
      session,
      unit
    });

    const movement = await createStockMovementFunction({
      ingredient,
      unit,
      payload,
      context,
      stock,
      session,
    });

    await session.commitTransaction();

    emitStockSocket(req, context, ingredient, stock);

    return res.status(201).json(
      new ApiResoponse(
        201,
        { stock, movement },
        "Stock movement created successfully"
      )
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});



export const getAllStockMovementsForOrders = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Access denied");
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;

  const { ingredientMasterId, fromDate, toDate, page = 1, limit = 10 } = req.query;

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

  const { data: movements, meta } = await paginate(StockMovement, filter, {
    page,
    limit,
    sort: { createdAt: -1 }
  });

  return res.status(200).json(
    new ApiResoponse(200, {
      movements,
      pagination: meta
    }, "Stock movements fetched")
  );
});

export const getAllStockMovementsExceptOrders = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Access denied");
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;

  const { ingredientMasterId, fromDate, toDate, page = 1, limit = 10 } = req.query;


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

  const { data: movements, meta } = await paginate(StockMovement, filter, {
    page,
    limit,
    sort: { createdAt: -1 }
  });

  return res.status(200).json(
    new ApiResoponse(200, {
      movements,
      pagination: meta
    }, "Stock movements fetched")
  );
});



export const getOrderConsumptionSummary = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(
      403,
      "Only OUTLET_MANAGER can view order consumption"
    );
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;



  const { fromDate, toDate } = req.query;

  if (!fromDate || !toDate) {
    throw new ApiError(
      400,
      "fromDate and toDate are required"
    );
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  const result = await StockMovement.aggregate([
    {
      $match: {
        "tenant.tenantId": tenantContext.tenantId,
        "outlet.outletId": outletContext.outletId,
        reason: "ORDER",
        createdAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: {
          ingredientName: "$ingredient.ingredientMasterName",
          unit: "$unit",
        },
        totalConsumed: {
          $sum: "$quantity",
        },
      },
    },
    {
      $project: {
        _id: 0,
        ingredientName: "$_id.ingredientName",
        unit: "$_id.unit",
        totalConsumed: 1,
      },
    },
    {
      $sort: {
        ingredientName: 1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResoponse(
      200,
      result,
      "Order consumption summary fetched successfully"
    )
  );
});
