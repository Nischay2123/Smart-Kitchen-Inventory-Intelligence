import mongoose from "mongoose";

const { Schema, model } = mongoose;

const SaleItemSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    qty: {
      type: Number,
      required: true,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    makingCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const SalesSchema = new Schema(
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

    outlet: {
      type: {
        outletId: {
          type: Schema.Types.ObjectId,
          ref: "Outlet",
          required: true,
        },
        outletName: {
          type: String,
          required: true,
          trim: true,
        },
      },
      required: true,
    },

  requestId: {
    type: String,
    required: true,
    unique: true,
  },

    items: {
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Sale must contain at least one item",
      },
    },

    state: {
      type: String,
      enum: ["CONFIRMED", "CANCELED"],
      required: true,
      default: "CONFIRMED",
    },
  },
  {
    timestamps: true,
  }
);

export default model("Sales", SalesSchema);
