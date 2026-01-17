import Unit from "../models/baseUnit.model.js";
import Tenant from "../models/tenant.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createUnit = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create units");
  }

  const { unit, baseUnit, conversionRate } = req.body;

  if (!unit || !baseUnit || conversionRate === undefined) {
    throw new ApiError(
      400,
      "unit, baseUnit and conversionRate are required"
    );
  }

  if (conversionRate <= 0) {
    throw new ApiError(
      400,
      "conversionRate must be greater than 0"
    );
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const tenantExists = await Tenant.findById(tenantContext.tenantId);
  if (!tenantExists) {
    throw new ApiError(404, "Tenant not found");
  }

  const existingUnit = await Unit.findOne({
    "tenant.tenantId": tenantContext.tenantId,
    unit: unit.trim(),
    baseUnit: baseUnit.trim()
  });

  if (existingUnit) {
    throw new ApiError(
      409,
      "Unit already exists for this tenant"
    );
  }

  const createdUnit = await Unit.create({
    tenant: {
      tenantId: tenantContext.tenantId,
      tenantName: tenantContext.tenantName,
    },
    unit: unit.trim(),
    baseUnit: baseUnit.trim(),
    conversionRate,
  });

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        _id: createdUnit._id,
        unit: createdUnit.unit,
        baseUnit: createdUnit.baseUnit,
        conversionRate: createdUnit.conversionRate,
        tenant: createdUnit.tenant,
        createdAt: createdUnit.createdAt,
      },
      "Unit created successfully"
    )
  );
});

export const getAllBaseUnits = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can view units");
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
  };

  const units = await Unit.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      units,
      "Units fetched successfully"
    )
  );
});
