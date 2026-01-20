import { orderQueue } from "../queues/order.queue.js";
import { v4 as uuid } from "uuid";
import { buildStockRequirement } from "../services/stockRequirement.service.js";
import { validateStock } from "../services/stockValidator.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import Stock from "../models/stock.model.js";
import { ApiError } from "../utils/apiError.js";

export const createSale = asyncHandler(async (req, res) => {

  const { items } = req.body;
  const tenant = req.user.tenant;
  const outlet = req.user.outlet;

  const requirementList =
    await buildStockRequirement(items, tenant.tenantId);

  const validation =
    await validateStock(requirementList, outlet.outletId);

  if (!validation.isValid) {

    await orderQueue.add("sale.failed", {
      requestId: uuid(),
      state: "CANCELED",
      items,
      tenant,
      outlet,
      failed: validation.failed,
    });

    return res.status(400).json({
      state: "CANCELED",
      failed: validation.failed,
    });
  }

  const session = await mongoose.startSession();
  const requestId = uuid();

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

    res.status(201).json({
      state: "CONFIRMED",
      requestId,
    });


    try {
      // console.log(items);
      
      const job = await orderQueue.add("sale.confirmed", {
        requestId,
        tenant,
        outlet,
        items,
        requirementList,
      });

      console.log("JOB ADDED", job.id);

    } catch (err) {
      console.error("QUEUE_PUBLISH_FAILED", err);
    }

  } catch (err) {
    await session.abortTransaction();
    throw err;

  } finally {
    session.endSession();
  }
});
