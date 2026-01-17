import mongoose from "mongoose";

const { Schema, model } = mongoose;

const baseUnit = new Schema(
  {
    tenant: {
      type: {
        tenantId: {
          type: Schema.Types.ObjectId,
          ref: "Tenant",
          required: true,
        },
        tenantName: {
          type: String,
          required: true,
          trim: true,
        },
      },
      required: true,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    baseUnit: {
      type: String,
      required: true,
      trim: true,
    },

    conversionRate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);


export default model("Unit", baseUnit);
