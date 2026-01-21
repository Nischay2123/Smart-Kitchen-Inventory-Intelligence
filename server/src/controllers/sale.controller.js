import { orderQueue } from "../queues/order.queue.js";
import { v4 as uuid } from "uuid";
import { buildStockRequirement } from "../services/stockRequirement.service.js";
import { validateStock } from "../services/stockValidator.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import Stock from "../models/stock.model.js";
import Sale from "../models/sale.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";

export const createSale = asyncHandler(async (req, res) => {

  const { items } = req.body;
  const tenant = req.user.tenant;
  const outlet = req.user.outlet;
  
  const requirementList =
    await buildStockRequirement(items, tenant.tenantId);

  const validation =
    await validateStock(requirementList, outlet.outletId);

  const requestId = uuid();

  if (!validation.isValid) {
    
    orderQueue.add("sale.failed", {
      requestId,
      state: "CANCELED",
      items,
      tenant,
      outlet,
      failed: validation.failed,
    });

    return res.status(400).json({
      state: "CANCELED",
      requestId,
      failed: validation.failed,
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    for (const reqItem of requirementList) {

      const ok = await Stock.findOneAndUpdate(
        {
          "outlet.outletId": outlet.outletId,
          "masterIngredient.ingredientMasterId": reqItem.ingredientMasterId,
          currentStockInBase: { $gte: reqItem.requiredBaseQty },
        },

        {
          $inc: {
            currentStockInBase: -reqItem.requiredBaseQty,
          },
        },

        { session }
      );

      if (!ok) {
        throw new ApiError(400, "STOCK_CHANGED");
      }
    }

    await session.commitTransaction();

    


    
      
       orderQueue.add("sale.confirmed", {
        requestId,
        tenant,
        outlet,
        items,
        requirementList,
      });


    return res.status(201).json({
      state: "CONFIRMED",
      requestId,
    });

  } catch (err) {
    await session.abortTransaction();
    throw err;

  } finally {
    session.endSession();
  }
});


export const getAllSales = asyncHandler(async(req,res)=>{
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Access denied");
  }

  const tenantContext = req.user.tenant;
  const outletContext = req.user.outlet;

  const { fromDate, toDate } = req.query;

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
    "outlet.outletId": outletContext.outletId,
  };


  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const movements = await Sale.find(filter)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(200, movements, "Stock movements fetched")
  );
});
