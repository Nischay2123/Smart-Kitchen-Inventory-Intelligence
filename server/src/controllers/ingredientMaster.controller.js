import mongoose from "mongoose";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Unit from "../models/baseUnit.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createIngredient = asyncHandler(async (req, res) => {

  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create ingredients");
  }

  const { name, unitIds, threshold } = req.body;

  // ───────────── VALIDATION ─────────────

  if (
    !name ||
    !Array.isArray(unitIds) ||
    unitIds.length === 0 ||
    !threshold ||
    !threshold.low ||
    !threshold.critical ||
    !threshold.unitId
  ) {
    throw new ApiError(
      400,
      "name, unitIds, threshold values and threshold unit are required"
    );
  }

  const tenantContext = req.user.tenant;

  // validate objectIds
  [...unitIds, threshold.unitId].forEach(id => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid unitId: ${id}`);
    }
  });

  // ───────────── FETCH UNITS ─────────────

  const units = await Unit.find({
    _id: { $in: unitIds },
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (units.length !== unitIds.length) {
    throw new ApiError(
      404,
      "One or more units not found for this tenant"
    );
  }

  // all units must share same baseUnit
  const baseUnitSet = new Set(units.map(u => u.baseUnit));

  if (baseUnitSet.size > 1) {
    throw new ApiError(
      400,
      "All selected units must have same baseUnit"
    );
  }

  // ───────────── THRESHOLD UNIT ─────────────

  const thresholdUnit = units.find(
    u => String(u._id) === String(threshold.unitId)
  );

  if (!thresholdUnit) {
    throw new ApiError(
      400,
      "Threshold unit must be one of selected units"
    );
  }

  // logical validation
  if (Number(threshold.critical) > Number(threshold.low)) {
    throw new ApiError(
      400,
      "Critical cannot be greater than Low threshold"
    );
  }

  // ───────────── DUPLICATE CHECK ─────────────

  const existing = await IngredientMaster.findOne({
    "tenant.tenantId": tenantContext.tenantId,
    name: name.trim(),
  });

  if (existing) {
    throw new ApiError(409, "Ingredient already exists");
  }

  // ───────────── CREATE ─────────────

  const ingredient = await IngredientMaster.create({

    tenant: {
      tenantId: tenantContext.tenantId,
      tenantName: tenantContext.tenantName,
    },

    name: name.trim(),

    // allowed units
    unit: units.map(u => ({
      unitId: u._id,
      unitName: u.unit,
      baseUnit: u.baseUnit,
      conversionRate: u.conversionRate,
    })),

    // threshold with context
    threshold: {
      lowInBase:
        Number(threshold.low) *
        thresholdUnit.conversionRate,

      criticalInBase:
        Number(threshold.critical) *
        thresholdUnit.conversionRate,

      unit: {
        unitId: thresholdUnit._id,
        unitName: thresholdUnit.unit,
        baseUnit: thresholdUnit.baseUnit,
        conversionRate: thresholdUnit.conversionRate,
      },
    },
  });

  return res.status(201).json(
    new ApiResoponse(
      201,
      ingredient,
      "Ingredient created successfully"
    )
  );
});



export const getAllIngredients = asyncHandler(async (req, res) => {
  if (req.user.role === "SUPER_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN and OUTLET_MANAGER can view ingredients");
  }

  const tenantContext = req.user.tenant;
  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
  };


  const ingredients = await IngredientMaster.find(filter)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      ingredients,
      "Ingredients fetched successfully"
    )
  );
});

export const deleteIngredient = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can delete ingredients");
  }

  const { ingredientId } = req.params;
  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  if (!mongoose.Types.ObjectId.isValid(ingredientId)) {
    throw new ApiError(400, "Invalid ingredientId");
  }

  const ingredient = await IngredientMaster.findOne({
    _id: ingredientId,
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (!ingredient) {
    throw new ApiError(
      404,
      "Ingredient not found or does not belong to your tenant"
    );
  }

  await IngredientMaster.deleteOne({ _id: ingredient._id });

  return res.status(200).json(
    new ApiResoponse(
      200,
      { ingredientId: ingredient._id },
      "Ingredient deleted successfully"
    )
  );
});
