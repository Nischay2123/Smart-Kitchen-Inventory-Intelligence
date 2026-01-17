import mongoose from "mongoose";

const { Schema, model } = mongoose;

const MenuItemSchema = new Schema(
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

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);


export default model("MenuItem", MenuItemSchema);
