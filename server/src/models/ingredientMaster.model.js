import mongoose from "mongoose";

const { Schema, model } = mongoose;

const IngredientMasterSchema = new Schema(
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

    name: {
      type: String,
      required: true,
      trim: true
    },

    threshold: {
      lowInBase: {
        type: Number,
        required: true,
        min: 0,
      },
      criticalInBase: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        unitId: {
          type: Schema.Types.ObjectId,
          ref: "Unit",
          required: true,
        },
        unitName: {
          type: String,
          required: true,
          trim: true,
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
      }
    },

    unit: [{
      unitId: {
        type: Schema.Types.ObjectId,
        ref: "Unit",
        required: true,
      },
      unitName: {
        type: String,
        required: true,
        trim: true,
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
    }],
  },
  {
    timestamps: true,
  }
);

IngredientMasterSchema.index({ "tenant.tenantId": 1, createdAt: -1 });

export default model("IngredientMaster", IngredientMasterSchema);
