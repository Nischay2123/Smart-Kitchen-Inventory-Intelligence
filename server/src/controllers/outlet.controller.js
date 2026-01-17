import Outlet from "../models/outlet.model.js";
import Tenant from "../models/tenant.model.js";
import User from '../models/user.model.js';
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createOutlet = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create an outlet");
  }

  const {
    outletName,
    address,
  } = req.body;

  if (
    !outletName ||
    !address ||
    !address.line ||
    !address.city ||
    !address.state ||
    !address.pincode
  ) {
    throw new ApiError(400, "All outlet and address fields are required");
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const tenantExists = await Tenant.findById(
    tenantContext.tenantId
  );

  if (!tenantExists) {
    throw new ApiError(404, "Tenant not found");
  }

  const existingOutlet = await Outlet.findOne({
    "tenant.tenantId": tenantContext.tenantId,
    outletName: outletName.trim(),
  });

  if (existingOutlet) {
    throw new ApiError(
      409,
      "Outlet with this name already exists for this tenant"
    );
  }

  const outlet = await Outlet.create({
    tenant: {
      tenantId: tenantContext.tenantId,
      tenantName: tenantContext.tenantName, 
    },
    outletName: outletName.trim(),
    address: {
      ...address,
      country: address.country || "India",
    },
  });

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        _id: outlet._id,
        outletName: outlet.outletName,
        tenant: outlet.tenant,
        address: outlet.address,
        createdAt: outlet.createdAt,
      },
      "Outlet created successfully"
    )
  );
});

export const getAllOutlets = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can view outlets");
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }


  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
  };


  const outlets = await Outlet.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      outlets,
      "Outlets fetched successfully"
    )
  );
});

export const deleteOutlet = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can delete outlets");
  }

  const { outletId } = req.params;
  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }
  //console.log(outletId, tenantContext);
  
  if (!mongoose.Types.ObjectId.isValid(outletId)) {
    throw new ApiError(400, "Invalid outletId");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const outlet = await Outlet.findOne({
      _id: outletId,
      "tenant.tenantId": tenantContext.tenantId,
    }).session(session);

    if (!outlet) {
      throw new ApiError(
        404,
        "Outlet not found or does not belong to your tenant"
      );
    }

    await User.deleteMany(
      {
        role: "OUTLET_MANAGER",
        "outlet.outletId": outlet._id,
        "tenant.tenantId": tenantContext.tenantId,
      },
      { session }
    );

    await Outlet.deleteOne(
      { _id: outlet._id },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResoponse(
        200,
        { outletId: outlet._id },
        "Outlet and all outlet managers deleted successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to delete outlet");
  }
});
