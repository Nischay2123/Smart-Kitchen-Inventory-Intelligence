import cron from "node-cron";
import mongoose from "mongoose";
import { Tenant } from "../models/tenant.model.js";
import { Sale } from "../models/sale.model.js";
import  TenantDailySnapshot  from "../models/tenantDailySnapshot.model.js";

const startOfDay = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (d) => {
  const date = new Date(d);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const getYesterdayRange = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return {
    start: startOfDay(d),
    end: endOfDay(d),
    day: startOfDay(d)
  };
};

const buildPipeline = (tenantId, start, end) => [
  {
    $match: {
      "tenant.tenantId": tenantId,
      createdAt: { $gte: start, $lte: end }
    }
  },
  { $unwind: "$items" },
  {
    $group: {
      _id: {
        outletId: "$outlet.outletId",
        outletName: "$outlet.outletName",
        state: "$state"
      },
      sale: { $sum: "$items.totalAmount" },
      makingCost: { $sum: "$items.makingCost" },
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: {
        outletId: "$_id.outletId",
        outletName: "$_id.outletName"
      },
      totalSale: {
        $sum: { $cond: [{ $eq: ["$_id.state", "CONFIRMED"] }, "$sale", 0] }
      },
      cogs: {
        $sum: { $cond: [{ $eq: ["$_id.state", "CONFIRMED"] }, "$makingCost", 0] }
      },
      confirmedOrders: {
        $sum: { $cond: [{ $eq: ["$_id.state", "CONFIRMED"] }, "$count", 0] }
      },
      canceledOrders: {
        $sum: { $cond: [{ $eq: ["$_id.state", "CANCELED"] }, "$count", 0] }
      }
    }
  }
];

const runDailySnapshotJob = async () => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { start, end, day } = getYesterdayRange();

    const tenants = await Tenant.find({ }).lean();

    for (const tenant of tenants) {
      const stats = await Sale.aggregate(
        buildPipeline(tenant._id, start, end)
      );

      if (!stats.length) continue;

      const ops = stats.map((row) => ({
        updateOne: {
          filter: {
            tenantId: tenant._id,
            outletId: row._id.outletId,
            date: day
          },
          update: {
            $set: {
              tenantId: tenant._id,
              outletId: row._id.outletId,
              outletName: row._id.outletName,
              date: day,
              totalSale: row.totalSale,
              confirmedOrders: row.confirmedOrders,
              canceledOrders: row.canceledOrders,
              cogs: row.cogs
            }
          },
          upsert: true
        }
      }));

      await TenantDailySnapshot.bulkWrite(ops, { session });
    }

    await session.commitTransaction();
    console.log(" Daily snapshot cron completed");
  } catch (err) {
    await session.abortTransaction();
    console.error(" Daily snapshot cron failed", err);
  } finally {
    session.endSession();
  }
};

cron.schedule("0 1 * * *", runDailySnapshotJob, {
  timezone: "Asia/Kolkata"
});
