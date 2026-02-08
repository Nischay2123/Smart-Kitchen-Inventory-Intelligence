import mongoose from "mongoose";

const { Schema, model } = mongoose;

const StockSchema = new Schema(
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

        masterIngredient: {
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

        baseUnit: {
            type: String,
            required: true,
        },

        currentStockInBase: {
            type: Number,
            required: true,
            min: 0,
        },

        unitCost :{
            type:Number,
            required:true,
            min:0
        },

        alertState: {
            type: String,
            enum: ["OK", "LOW", "CRITICAL"],
            required: true,
            default: "OK",
        },
    },
    {
        timestamps: true,
    }
);


StockSchema.index({ "outlet.outletId": 1, "masterIngredient.ingredientMasterId": 1 });


export default model("Stock", StockSchema);
