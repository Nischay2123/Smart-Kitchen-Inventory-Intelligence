import POSApiKey from "../models/posApiKey.model.js";
import Outlet from "../models/outlet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const generateAPIKey = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can generate API keys");
  }

  const { outletId, description } = req.body;

  if (!outletId) {
    throw new ApiError(400, "outletId is required");
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
    throw new ApiError(404, "Outlet not found or access denied");
  }

  const plainAPIKey = POSApiKey.generateAPIKey(outlet._id.toString());
  const keyPrefix = POSApiKey.getKeyPrefix(plainAPIKey);



  const apiKeyRecord = await POSApiKey.create({
    apiKeyHash: plainAPIKey,
    keyPrefix,
    tenant: {
      tenantId: tenantContext.tenantId,
      tenantName: tenantContext.tenantName,
    },
    outlet: {
      outletId: outlet._id,
      outletName: outlet.outletName,
    },
    createdBy: {
      userId: req.user._id,
      userEmail: req.user.email,
    },
    description: description || "",
  });

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        apiKey: plainAPIKey,
        keyId: apiKeyRecord._id,
        keyPrefix,
        tenant: apiKeyRecord.tenant,
        outlet: apiKeyRecord.outlet,
        description: apiKeyRecord.description,
      },
      "API key generated successfully. Please save this key securely - it will not be shown again."
    )
  );
});

export const revokeAPIKey = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can revoke API keys");
  }

  const { keyId } = req.params;

  if (!keyId || !mongoose.Types.ObjectId.isValid(keyId)) {
    throw new ApiError(400, "Valid keyId is required");
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const apiKeyRecord = await POSApiKey.findOne({
    _id: keyId,
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (!apiKeyRecord) {
    throw new ApiError(404, "API key not found or access denied");
  }

  apiKeyRecord.isActive = false;
  await apiKeyRecord.save();

  return res.status(200).json(
    new ApiResoponse(200, { keyId }, "API key revoked successfully")
  );
});

export const listAPIKeys = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can list API keys");
  }

  const { outletId } = req.query;

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
  };

  if (outletId) {
    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      throw new ApiError(400, "Invalid outletId");
    }
    filter["outlet.outletId"] = outletId;
  }

  const apiKeys = await POSApiKey.find(filter)
    .select("-apiKeyHash")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      {
        count: apiKeys.length,
        apiKeys: apiKeys.map((key) => ({
          keyId: key._id,
          keyPrefix: key.keyPrefix,
          tenant: key.tenant,
          outlet: key.outlet,
          isActive: key.isActive,
          lastUsedAt: key.lastUsedAt,
          createdAt: key.createdAt,
          expiresAt: key.expiresAt,
          description: key.description,
          createdBy: key.createdBy,
        })),
      },
      "API keys retrieved successfully"
    )
  );
});


