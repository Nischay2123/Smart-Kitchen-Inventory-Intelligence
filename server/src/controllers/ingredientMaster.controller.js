import mongoose from "mongoose";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Tenant from "../models/tenant.model.js";
import Unit from "../models/baseUnit.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createIngredient = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create ingredients");
  }

  const { name, unitId, threshold} = req.body;
  // console.log(name,unitId, threshold);
  
  if (!name || !unitId || !threshold || !threshold.lowInBase || !threshold.criticalInBase) {
    throw new ApiError(400, "name and unitId and threshold parameters are required");
  }

  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw new ApiError(400, "Invalid unitId");
  }

  const tenantContext = req.user.tenant;
  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }
  if (threshold.criticalInBase>threshold.lowInBase) {
    throw new ApiError(400, "Low Value can not be smaller than critical value");
  }

  const unit = await Unit.findOne({
    _id: unitId,
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (!unit) {
    throw new ApiError(
      404,
      "Unit not found or does not belong to your tenant"
    );
  }

  const existingIngredient = await IngredientMaster.findOne({
    "tenant.tenantId": tenantContext.tenantId,
    name: name.trim(),
  });

  if (existingIngredient) {
    throw new ApiError(
      409,
      "Ingredient with this name already exists for this tenant"
    );
  }

  const ingredient = await IngredientMaster.create({
    tenant: {
      tenantId: tenantContext.tenantId,
      tenantName: tenantContext.tenantName,
    },
    name: name.trim(),
    unit: {
      unitId: unit._id,
      unitName: unit.unit,
      baseUnit: unit.baseUnit,
      conversionRate: unit.conversionRate,
    },
    threshold:{
      lowInBase :(threshold.lowInBase * unit.conversionRate),
      criticalInBase:(threshold.criticalInBase * unit.conversionRate)
    }
  });

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        _id: ingredient._id,
        name: ingredient.name,
        unit: ingredient.unit,
        tenant: ingredient.tenant,
        threshold: ingredient.threshold,
        createdAt: ingredient.createdAt,
      },
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
