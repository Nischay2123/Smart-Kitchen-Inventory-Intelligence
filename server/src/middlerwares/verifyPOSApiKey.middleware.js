import POSApiKey from "../models/posApiKey.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyPOSApiKey = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    throw new ApiError(401, "API key is required. Please provide X-API-Key header.");
  }

  const keyPrefix = POSApiKey.getKeyPrefix(apiKey);
  
  if (!keyPrefix) {
    throw new ApiError(401, "Invalid API key format");
  }

  const keyRecord = await POSApiKey.findOne({
    "outlet.outletId": keyPrefix,
    isActive: true,
  }).select("+apiKeyHash");

  if (!keyRecord) {
    throw new ApiError(401, "Invalid or inactive API key");
  }


  const isValid = await keyRecord.compareAPIKey(apiKey);
  
  if (!isValid) {
    throw new ApiError(401, "Invalid API key");
  }

  req.posAuth = {
    apiKeyId: keyRecord._id,
    tenant: {
      tenantId: keyRecord.tenant.tenantId,
      tenantName: keyRecord.tenant.tenantName,
    },
    outlet: {
      outletId: keyRecord.outlet.outletId,
      outletName: keyRecord.outlet.outletName,
    },
  };

  next();
});
