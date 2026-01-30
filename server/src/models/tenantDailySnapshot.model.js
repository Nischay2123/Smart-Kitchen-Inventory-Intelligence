import mongoose, { model } from "mongoose";

const tenantDailySnapshotSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Tenant"
    },

    outletId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Outlet"
    },

    outletName: {
      type: String,
      required: true,
      trim: true
    },

    date: {
        type: Date,
        required: true,
        set: (v) => new Date(new Date(v).setUTCHours(0, 0, 0, 0))
    },


    totalSale: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    confirmedOrders: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    canceledOrders: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    cogs: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

tenantDailySnapshotSchema.index(
  { tenantId: 1, date: 1 },
);

export default model(
  "TenantDailySnapshot",
  tenantDailySnapshotSchema
);
