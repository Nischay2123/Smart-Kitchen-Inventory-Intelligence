import Tenant from "../models/tenant.model.js";
import User from "../models/user.model.js";
import Outlet from "../models/outlet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";


export const createTenant = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only SUPER_ADMIN can create a tenant"
    );
  }

  const { name } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Tenant name is required");
  }

  const existingTenant = await Tenant.findOne({
    name: name.trim(),
  });

  if (existingTenant) {
    throw new ApiError(
      409,
      "Tenant with this name already exists"
    );
  }

  const tenant = await Tenant.create({
    name: name.trim(),
  });

  if (!tenant) {
    throw new ApiError(
      500,
      "Failed to create tenant"
    );
  }

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        _id: tenant._id,
        name: tenant.name,
        createdAt: tenant.createdAt,
      },
      "Tenant created successfully"
    )
  );
});

export const getAllTenants = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only SUPER_ADMIN can view tenants"
    );
  }

  const tenants = await Tenant.find({})
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      tenants,
      "Tenants fetched successfully"
    )
  );
});

export const deleteTenant = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only SUPER_ADMIN can delete a tenant");
  }

  const { tenantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tenantId)) {
    throw new ApiError(400, "Invalid tenantId");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenant = await Tenant.findById(tenantId).session(session);

    if (!tenant) {
      throw new ApiError(404, "Tenant not found");
    }

    await User.deleteMany(
      { "tenant.tenantId": tenant._id },
      { session }
    );

    await Outlet.deleteMany(
      { "tenant.tenantId": tenant._id },
      { session }
    );

    await Tenant.deleteOne(
      { _id: tenant._id },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResoponse(
        200,
        { tenantId: tenant._id },
        "Tenant and all related data deleted successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to delete tenant");
  }
});


