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

    quantity: {     
      type: Number,
      required: true,
    },

    unit:{
      type: String,
      required:true
    },

    reason: {
      type: String,
      required: true,
      enum: ["ORDER", "PURCHASE", "POSITIVE_ADJUSTMENT","NEGATIVE_ADJUSTMENT"],
    },

    orderId: {
      type: String,        
      ref: "Sales",
      default:null
    },


    stockId:{
      type: Schema.Types.ObjectId,
      ref:"Stock",
      default:null
    },

    purchasePriceInUnit:{
      type: Number,
      default: null,
      min:0
    },

    unitCost :{
      type:Number,
      min:0,
      default:0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

StockMovementSchema.index({
  "tenant.tenantId": 1,
  "outlet.outletId": 1,
  "reason":1,
  createdAt: -1,
});


StockMovementSchema.index({
  "tenant.tenantId": 1,
  "reason":1,
  createdAt: -1,
});


export default model("StockMovement", StockMovementSchema);
