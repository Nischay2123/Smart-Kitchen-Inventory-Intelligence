import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const { Schema, model } = mongoose;

const POSApiKeySchema = new Schema(
  {
    apiKeyHash: {
      type: String,
      required: true,
      select: false,
    },

    keyPrefix: {
      type: String,
      required: true,
    },

    tenant: {
      _id: false,
      type: {
        tenantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tenant",
          required: true,
        },
        tenantName: {
          type: String,
          trim: true,
          required: true,
        },
      },
      required: true,
    },

    outlet: {
      _id: false,
      type: {
        outletId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Outlet",
          required: true,
        },
        outletName: {
          type: String,
          trim: true,
          required: true,
        },
      },
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },


    createdBy: {
      _id: false,
      "userId": {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    "userEmail": {
      type: String,
      trim: true,
      required: true,
      },
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

  },
  {
    timestamps: true,
  }
);

POSApiKeySchema.index({ keyPrefix: 1, isActive: 1 });
POSApiKeySchema.index({ "tenant.tenantId": 1, "outlet.outletId": 1 });

POSApiKeySchema.statics.generateAPIKey = function (outletId) {
  const randomPart = crypto.randomBytes(24).toString("hex");
  const apiKey = `pos_${outletId}_${randomPart}`;
  return apiKey;
};

POSApiKeySchema.statics.extractOutletId = function (apiKey) {
  const parts = apiKey.split("_");
  if (parts.length >= 3 && parts[0] === "pos") {
    return parts[1];
  }
  return null;
};

POSApiKeySchema.statics.getKeyPrefix = function (apiKey) {
  const parts = apiKey.split("_");
  if (parts.length >= 3 && parts[0] === "pos") {
    return parts[1];
  }
  return null;
};

POSApiKeySchema.pre("save", async function (next) {
  if (!this.isModified("apiKeyHash")) {
    return next();
  }

  try {
    this.apiKeyHash = await bcrypt.hash(this.apiKeyHash, 10);
    next();
  } catch (error) {
    next(error);
  }
});

POSApiKeySchema.methods.compareAPIKey = async function (candidateKey) {
  try {
    return await bcrypt.compare(candidateKey, this.apiKeyHash);
  } catch (error) {
    return false;
  }
};


export default model("POSApiKey", POSApiKeySchema);
