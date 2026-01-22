import mongoose from "mongoose";

const { Schema, model } = mongoose;

const CancelIngredientSchema = new Schema(
  {
    ingredientMasterId: {
      type: Schema.Types.ObjectId,
      ref: "IngredientMaster",
      required: true,
    },

    ingredientMasterName: {
      type: String,
      required: true,
      trim: true,
    },

    requiredQty: {
      type: Number,
      required: true,
      min: 0,
    },

    availableStock: {
      type: Number,
      required: true,
      min: 0,
    },

    issue: {
      type: String,
      enum: ["INGREDIENT_NOT_FOUND", "INSUFFICIENT_STOCK"],
      required: true,
    },
  },
  { _id: false }
);

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

    cancelIngredientDetails: {
      type: [CancelIngredientSchema],
      default: [],
    },
  },
  { _id: false }
);

const SalesSchema = new Schema(
  {
    

    tenant: {
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

    outlet: {
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

    items: {
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Sale must contain at least one item",
      },
    },

    state: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELED"],
      required: true,
      default: "PENDING",
    },

    reason: {
      type: String,
      enum: [
        "RECIPE_NOT_FOUND",
        "INGREDIENT_NOT_FOUND",
        "INSUFFICIENT_STOCK",
        "STOCK_CHANGED",
      ],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Sales", SalesSchema);
