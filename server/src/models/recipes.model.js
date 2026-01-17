import mongoose from "mongoose";

const { Schema, model } = mongoose;

const RecipeItemSchema = new Schema(
  {
    ingredientMasterId: {
      type: Schema.Types.ObjectId,
      ref: "IngredientMaster",
      required: true,
    },

    ingredientName: {
      type: String,
      required: true,
      trim: true,
    },
    baseQty: {
      type: Number,
      required: true,
      min: 0,
    },
    baseUnit: {
      type: String,
      required: true,
      trim:true
    },
  },
  { _id: false }
);

const RecipeSchema = new Schema(
  {
    tenant: {
      type: {
        tenantId: {
          type: Schema.Types.ObjectId,
          ref: "Tenant",
          required: true,
          index: true,
        },
        tenantName: {
          type: String,
          required: true,
          trim: true,
        },
      },
      required: true,
    },

    item: {
      type: {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
          index: true,
        },
        itemName: {
          type: String,
          required: true,
          trim: true,
        },
      },
      required: true,
    },

    recipeItems: {
      type: [RecipeItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Recipe must have at least one ingredient",
      },
    },
  },
  {
    timestamps: true,
  }
);

export default model("Recipe", RecipeSchema);
