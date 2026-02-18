import mongoose from "mongoose";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Unit from "../models/baseUnit.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../utils/pagination.js";
import { cacheService } from "../services/cache.service.js";

export const createIngredient = asyncHandler(async (req, res) => {

  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create ingredients");
  }

  const { name, unitIds, threshold } = req.body;


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

  [...unitIds, threshold.unitId].forEach(id => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid unitId: ${id}`);
    }
  });


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

  const baseUnitSet = new Set(units.map(u => u.baseUnit));

  if (baseUnitSet.size > 1) {
    throw new ApiError(
      400,
      "All selected units must have same baseUnit"
    );
  }


  const thresholdUnit = units.find(
    u => String(u._id) === String(threshold.unitId)
  );

  if (!thresholdUnit) {
    throw new ApiError(
      400,
      "Threshold unit must be one of selected units"
    );
  }

  if (Number(threshold.critical) > Number(threshold.low)) {
    throw new ApiError(
      400,
      "Critical cannot be greater than Low threshold"
    );
  }


  const existing = await IngredientMaster.findOne({
    "tenant.tenantId": tenantContext.tenantId,
    name: name.trim(),
  });

  if (existing) {
    throw new ApiError(409, "Ingredient already exists");
  }


  const ingredient = await IngredientMaster.create({

    tenant: {
      tenantId: tenantContext.tenantId,
      tenantName: tenantContext.tenantName,
    },

    name: name.trim(),

    unit: units.map(u => ({
      unitId: u._id,
      unitName: u.unit,
      baseUnit: u.baseUnit,
      conversionRate: u.conversionRate,
    })),

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


  const cacheKey = cacheService.generateKey(
    "ingredient",
    tenantContext.tenantId,
    ingredient._id
  );
  await cacheService.set(cacheKey, ingredient);

  return res.status(201).json(
    new ApiResoponse(
      201,
      ingredient,
      "Ingredient created successfully"
    )
  );
});

export const createIngredientBulk = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create ingredients");
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User not associated with tenant");
  }

  const payload = req.body;

  if (!Array.isArray(payload) || !payload.length) {
    throw new ApiError(400, "No ingredients provided");
  }

  const errors = [];
  const docsToInsert = [];

  const allUnitNames = new Set();

  payload.forEach(doc => {
    (doc.unitNames || []).forEach(name => allUnitNames.add(name.trim()));
    if (doc?.threshold?.unitName)
      allUnitNames.add(doc.threshold.unitName.trim());
  });

  const units = await Unit.find({
    unit: { $in: [...allUnitNames] },
    "tenant.tenantId": tenantContext.tenantId,
  }).lean();

  const unitMap = new Map(
    units.map(u => [u.unit, u])
  );

  const existingIngredients = await IngredientMaster.find({
    "tenant.tenantId": tenantContext.tenantId,
  })
    .select("name")
    .lean();

  const existingNames = new Set(
    existingIngredients.map(i => i.name.toLowerCase())
  );

  for (const [index, doc] of payload.entries()) {
    const rowNum = index + 1;
    const { name, unitNames, threshold, baseUnit } = doc;

    if (
      !name ||
      !Array.isArray(unitNames) ||
      !unitNames.length ||
      !threshold ||
      !baseUnit
    ) {
      errors.push(`Row ${rowNum}: Missing fields`);
      continue;
    }

    const normalizedName = name.trim().toLowerCase();

    if (existingNames.has(normalizedName)) {
      errors.push(`Row ${rowNum}: Ingredient '${name}' exists`);
      continue;
    }

    const rowUnits = [];
    const baseUnits = new Set();

    let invalidUnit = false;

    for (const unitName of unitNames) {
      const unit = unitMap.get(unitName.trim());

      if (!unit) {
        errors.push(`Row ${rowNum}: Unit '${unitName}' not found`);
        invalidUnit = true;
        break;
      }

      const unitBase = unit.baseUnit;
      if (unitBase !== baseUnit.trim()) {
        errors.push(`Row ${rowNum}: Unit '${unitName}' has base '${unitBase}', expected '${baseUnit}'`);
        invalidUnit = true;
        break;
      }

      baseUnits.add(unit.baseUnit);
      rowUnits.push(unit);
    }

    if (invalidUnit) continue;

    if (baseUnits.size > 1) {
      errors.push(`Row ${rowNum}: Units must share base`);
      continue;
    }

    const thresholdUnit = unitMap.get(
      threshold.unitName.trim()
    );

    if (!thresholdUnit) {
      errors.push(`Row ${rowNum}: Threshold unit '${threshold.unitName}' not found`);
      continue;
    }

    const isThresholdInUnits = rowUnits.some(u => String(u._id) === String(thresholdUnit._id));
    if (!isThresholdInUnits) {
      errors.push(`Row ${rowNum}: Threshold unit must be one of the selected units`);
      continue;
    }

    if (Number(threshold.critical) > Number(threshold.low)) {
      errors.push(`Row ${rowNum}: Critical > Low`);
      continue;
    }

    existingNames.add(normalizedName);

    docsToInsert.push({
      tenant: {
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
      },

      name: name.trim(),

      unit: rowUnits.map(u => ({
        unitId: u._id,
        unitName: u.unit,
        baseUnit: u.baseUnit,
        conversionRate: u.conversionRate,
      })),

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
  }

  let insertedDocs = [];

  if (docsToInsert.length) {
    insertedDocs = await IngredientMaster.insertMany(
      docsToInsert,
      { ordered: false }
    );
  }

  await Promise.allSettled(
    insertedDocs.map(doc => {
      const key = cacheService.generateKey(
        "ingredient",
        tenantContext.tenantId,
        doc._id
      );
      return cacheService.set(key, doc);
    })
  );

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        inserted: insertedDocs.length,
        failed: errors.length,
        errors,
      },
      "Bulk ingredient creation completed"
    )
  );
});


export const getAllIngredients = asyncHandler(async (req, res) => {
  if (req.user.role === "SUPER_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN and OUTLET_MANAGER can view ingredients");
  }
  const { page, limit, search } = req.query;
  const tenantContext = req.user.tenant;
  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
  };


  // const ingredients = await IngredientMaster.find(filter)
  //   .sort({ createdAt: -1 });

  const { data: ingredients, meta } = await paginate(IngredientMaster, filter, {
    page,
    limit,
    search,
    sort: { createdAt: -1 }
  });

  return res.status(200).json(
    new ApiResoponse(
      200,
      {
        ingredients,
        pagination: meta
      },
      "Ingredients fetched successfully"
    )
  );
});
export const getAllIngredientsInOnce = asyncHandler(async (req, res) => {
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

  // Delete Cache
  const cacheKey = cacheService.generateKey(
    "ingredient",
    tenantContext.tenantId,
    ingredient._id
  );
  await cacheService.del(cacheKey);

  return res.status(200).json(
    new ApiResoponse(
      200,
      { ingredientId: ingredient._id },
      "Ingredient deleted successfully"
    )
  );
});
