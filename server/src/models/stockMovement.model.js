import mongoose from "mongoose";

const { Schema, model } = mongoose;

const StockMovementSchema = new Schema(
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

    ingredient: {
      type: {
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
      },
      required: true,
    },

    deltaInBase: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      enum: ["ORDER", "PURCHASE", "POSITIVE_ADJUSTMENT","NEGATIVE_ADJUSTMENT"],
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default model("StockMovement", StockMovementSchema);
