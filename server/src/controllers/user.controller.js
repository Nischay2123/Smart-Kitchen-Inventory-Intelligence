import mongoose from "mongoose";
import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {generateAccessToken} from "../utils/token.js"
import Outlet from "../models/outlet.model.js";
import Tenant from "../models/tenant.model.js";

export const createBrandManager = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only SUPER_ADMIN can create a Brand Manager"
    );
  }

  const {
    userName,
    email,
    password,
    tenantId,
  } = req.body;

  if (!userName || !email || !password || !tenantId) {
    throw new ApiError(
      400,
      "userName, email, password, tenantId are required"
    );
  }
  const tenant = await Tenant.findOne({_id:new mongoose.Types.ObjectId(tenantId)})
  const existingUser = await User.findOne({ email, "tenant.tenantId": tenantId });

  if (existingUser) {
    throw new ApiError(
      409,
      "BrandManger of this brand with this email already exists"
    );
  }
  
  const brandManager = await User.create({
    userName,
    email,
    password,
    role: "BRAND_ADMIN",
    tenant: {
      tenantId:tenant._id,
      tenantName:tenant.name,
    }
  });

  if (!brandManager) {
    throw new ApiError(
      500,
      "Failed to create Brand Manager"
    );
  }
  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        _id: brandManager._id,
        userName: brandManager.userName,
        email: brandManager.email,
        role: brandManager.role,
        tenant: brandManager.tenant,
        createdAt: brandManager.createdAt,
      },
      "Brand Manager created successfully"
    )
  );
});

export const getAllBrandManagers = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only SUPER_ADMIN can view Brand Managers"
    );
  }

  const { tenantId } = req.query;

  const filter = {
    role: "BRAND_ADMIN",
  };

  if (tenantId) {
    filter["tenant.tenantId"] = tenantId;
  }else{
    throw new ApiError(400,"TenantId not found")
  }

  const brandManagers = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      brandManagers,
      "Brand Managers fetched successfully"
    )
  );
});


export const deleteBrandManager = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only SUPER_ADMIN can delete Brand Managers"
    );
  }

  const { managerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(managerId)) {
    throw new ApiError(400, "Invalid managerId");
  }

  const manager = await User.findOne({
    _id: managerId,
    role: "BRAND_ADMIN",
  });

  if (!manager) {
    throw new ApiError(404, "Brand Manager not found");
  }

  await User.deleteOne({ _id: manager._id });

  return res.status(200).json(
    new ApiResoponse(
      200,
      { managerId: manager._id },
      "Brand Manager deleted successfully"
    )
  );
});

export const createOutletManager = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create an Outlet Manager");
  }

  const { userName, email, password, outletId } = req.body;

  if (!userName || !email || !password || !outletId) {
    throw new ApiError(
      400,
      "userName, email, password and outletId are required"
    );
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const outlet = await Outlet.findOne({
    _id: outletId,
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (!outlet) {
    throw new ApiError(
      404,
      "Outlet not found or does not belong to your tenant"
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const outletManager = await User.create({
    userName,
    email,
    password,
    role: "OUTLET_MANAGER",
    tenant: {
      tenantId: tenantContext.tenantId,
      tenantName: tenantContext.tenantName,
    },
    outlet: {
      outletId: outlet._id,
      outletName: outlet.outletName,
    },
  });

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        _id: outletManager._id,
        userName: outletManager.userName,
        email: outletManager.email,
        role: outletManager.role,
        tenant: outletManager.tenant,
        outlet: outletManager.outlet,
        createdAt: outletManager.createdAt,
      },
      "Outlet Manager created successfully"
    )
  );
});


export const getAllOutletManagers = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(
      403,
      "Only BRAND_ADMIN can view Outlet Managers"
    );
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const { outletId } = req.query;

  const filter = {
    role: "OUTLET_MANAGER",
    "tenant.tenantId": tenantContext.tenantId,
  };

  if (outletId) {
    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      throw new ApiError(400, "Invalid outletId");
    }
    filter["outlet.outletId"] = outletId;
  }else{
    throw new ApiError(400, "OutletId is not present");
  }

  const outletManagers = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      outletManagers,
      "Outlet Managers fetched successfully"
    )
  );
});

export const deleteOutletManager = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(
      403,
      "Only BRAND_ADMIN can delete Outlet Managers"
    );
  }

  const tenantContext = req.user.tenant;
  const { managerId } = req.params;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  if (!mongoose.Types.ObjectId.isValid(managerId)) {
    throw new ApiError(400, "Invalid managerId");
  }

  const manager = await User.findOne({
    _id: managerId,
    role: "OUTLET_MANAGER",
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (!manager) {
    throw new ApiError(
      404,
      "Outlet Manager not found or does not belong to your tenant"
    );
  }

  await User.deleteOne({ _id: manager._id });

  return res.status(200).json(
    new ApiResoponse(
      200,
      { managerId: manager._id },
      "Outlet Manager deleted successfully"
    )
  );
});


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken } = await generateAccessToken(user._id);



  return res.status(200).cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  }).json(
    new ApiResoponse(
      200,
      {
        accessToken,
        user: {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          role: user.role,
          tenant: user.tenant,
          outlet: user.outlet,
        },
      },
      "Login successful"
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json(
    new ApiResoponse(
      200,
      null,
      "Logged out successfully"
    )
  );
});


export const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200).json(
    new ApiResoponse(200,
    req.user,
    "User Fetched Successfully"
  )
  )
})