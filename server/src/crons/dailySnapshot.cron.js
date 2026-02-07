import cron from "node-cron";
import mongoose from "mongoose";
import Tenant  from "../models/tenant.model.js";
import Sale  from "../models/sale.model.js";
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

const getYesterdayRange = (date) => {
  let d ;
  if(date){
    d = new Date(date) ;
    d.setDate(d.getDate() );
  }
  else{
    d= new Date()
    d.setDate(d.getDate() - 1);
  } 
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
      // use orderDate here if available
    }
  },

  // 1️⃣ explode items
  { $unwind: "$items" },

  // 2️⃣ regroup to ONE document per SALE
  {
    $group: {
      _id: "$_id", // saleId
      outletId: { $first: "$outlet.outletId" },
      outletName: { $first: "$outlet.outletName" },
      state: { $first: "$state" },

      sale: { $sum: "$items.totalAmount" },
      makingCost: { $sum: "$items.makingCost" }
    }
  },

  // 3️⃣ now group by outlet
  {
    $group: {
      _id: {
        outletId: "$outletId",
        outletName: "$outletName"
      },

      totalSale: {
        $sum: {
          $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$sale", 0]
        }
      },

      cogs: {
        $sum: {
          $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$makingCost", 0]
        }
      },

      confirmedOrders: {
        $sum: {
          $cond: [{ $eq: ["$state", "CONFIRMED"] }, 1, 0]
        }
      },

      canceledOrders: {
        $sum: {
          $cond: [{ $eq: ["$state", "CANCELED"] }, 1, 0]
        }
      }
    }
  }
];


export const runDailySnapshotJob = async (req,res) => {
  const session = await mongoose.startSession();
  const {date}= req.body
  try {
    session.startTransaction();

    const { start, end, day } = getYesterdayRange(date);
    console.log({ start, end, day });
    
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
    return res.status(200).json({
      message:"success"
    })
  } catch (err) {
    await session.abortTransaction();
    console.error(" Daily snapshot cron failed", err);
    return res.status(401).json({
      error:err
    })
  } finally {
    session.endSession();
  }
};

cron.schedule("0 1 * * *", runDailySnapshotJob, {
  timezone: "Asia/Kolkata"
});
