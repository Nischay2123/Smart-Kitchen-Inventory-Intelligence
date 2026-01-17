import mongoose from "mongoose";

const { Schema, model } = mongoose;

const OutletSchema = new Schema(
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

    outletName: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      line: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: "India",
      },
      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default model("Outlet", OutletSchema);
