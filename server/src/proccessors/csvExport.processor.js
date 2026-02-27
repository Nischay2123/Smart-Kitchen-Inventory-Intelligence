import mongoose from "mongoose";
import Sale from "../models/sale.model.js";
import TenantDailySnapshot from "../models/tenantDailySnapshot.model.js";
import OutletItemDailySnapshot from "../models/outletItemDailySnapshot.model.js";
import StockMovement from "../models/stockMovement.model.js";

const startOfDay = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const todayStart = () => startOfDay(new Date());

const isTodayInRange = (from, to) => {
  const today = startOfDay(new Date());
  return today >= startOfDay(from) && today <= startOfDay(to);
};

const isPastInRange = (from) => startOfDay(from) < todayStart();

export async function* fetchProfitReport({ tenantId, outletId, fromDate, toDate }) {
  const outletObjId = new mongoose.Types.ObjectId(outletId);

  const map = new Map(); 

  if (isPastInRange(fromDate)) {
    const cursor = OutletItemDailySnapshot.aggregate([
      {
        $match: {
          "tenant.tenantId": tenantId,
          "outlet.outletId": outletObjId,
          date: { $gte: startOfDay(fromDate), $lte: startOfDay(toDate) },
        },
      },
      {
        $group: {
          _id: "$item.itemId",
          itemName: { $first: "$item.itemName" },
          totalQty: { $sum: "$totalQty" },
          totalRevenue: { $sum: "$totalRevenue" },
          totalMakingCost: { $sum: "$totalMakingCost" },
        },
      },
      {
        $project: {
          _id: 0,
          itemId: "$_id",
          itemName: 1,
          totalQty: 1,
          totalRevenue: 1,
          totalMakingCost: { $round: ["$totalMakingCost", 2] },
        },
      },
    ]).cursor();

    for await (const doc of cursor) {
      map.set(String(doc.itemId), { ...doc });
    }
  }

  if (isTodayInRange(fromDate, toDate)) {
    const cursor = Sale.aggregate([
      {
        $match: {
          "tenant.tenantId": tenantId,
          "outlet.outletId": outletObjId,
          createdAt: { $gte: todayStart() },
          state: "CONFIRMED",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemId",
          itemName: { $first: "$items.itemName" },
          totalQty: { $sum: "$items.qty" },
          totalRevenue: { $sum: "$items.totalAmount" },
          totalMakingCost: { $sum: "$items.makingCost" },
        },
      },
      {
        $project: {
          _id: 0,
          itemId: "$_id",
          itemName: 1,
          totalQty: 1,
          totalRevenue: 1,
          totalMakingCost: { $round: ["$totalMakingCost", 2] },
        },
      },
    ]).cursor();

    for await (const doc of cursor) {
      const key = String(doc.itemId);
      if (map.has(key)) {
        const e = map.get(key);
        e.totalQty += doc.totalQty;
        e.totalRevenue += doc.totalRevenue;
        e.totalMakingCost = +((e.totalMakingCost || 0) + doc.totalMakingCost).toFixed(2);
      } else {
        map.set(key, { ...doc });
      }
    }
  }

  for (const r of map.values()) {
    const profit = +(r.totalRevenue - r.totalMakingCost).toFixed(2);
    const profitMargin =
      r.totalRevenue > 0 ? +(((profit / r.totalRevenue) * 100).toFixed(2)) : 0;
    yield {
      itemName: r.itemName,
      totalQty: r.totalQty,
      totalRevenue: r.totalRevenue,
      totalMakingCost: r.totalMakingCost,
      profit,
      profitMargin,
    };
  }
}

export async function* fetchSalesReport({ tenantId, fromDate, toDate }) {
  const map = new Map(); 

  if (isPastInRange(fromDate)) {
    const cursor = TenantDailySnapshot.aggregate([
      {
        $match: {
          "tenant.tenantId": tenantId,
          date: { $gte: startOfDay(fromDate), $lte: startOfDay(toDate) },
        },
      },
      {
        $group: {
          _id: "$outlet.outletId",
          outletName: { $first: "$outlet.outletName" },
          totalSale: { $sum: "$totalSale" },
          confirmedOrders: { $sum: "$confirmedOrders" },
          canceledOrders: { $sum: "$canceledOrders" },
          cogs: { $sum: "$cogs" },
        },
      },
      {
        $project: {
          _id: 0,
          outletId: "$_id",
          outletName: 1,
          totalSale: 1,
          confirmedOrders: 1,
          canceledOrders: 1,
          cogs: 1,
        },
      },
    ]).cursor();

    for await (const doc of cursor) {
      map.set(String(doc.outletId), { ...doc });
    }
  }

  if (isTodayInRange(fromDate, toDate)) {
    const cursor = Sale.aggregate([
      {
        $match: {
          "tenant.tenantId": tenantId,
          createdAt: { $gte: todayStart() },
        },
      },
      {
        $project: {
          outletId: "$outlet.outletId",
          outletName: "$outlet.outletName",
          state: 1,
          sale: { $sum: "$items.totalAmount" },
          cogs: { $sum: "$items.makingCost" },
        },
      },
      {
        $group: {
          _id: "$outletId",
          outletName: { $first: "$outletName" },
          totalSale: {
            $sum: { $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$sale", 0] },
          },
          cogs: {
            $sum: { $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$cogs", 0] },
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$state", "CONFIRMED"] }, 1, 0] },
          },
          canceledOrders: {
            $sum: { $cond: [{ $eq: ["$state", "CANCELED"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          outletId: "$_id",
          outletName: 1,
          totalSale: 1,
          confirmedOrders: 1,
          canceledOrders: 1,
          cogs: 1,
        },
      },
    ]).cursor();

    for await (const doc of cursor) {
      const key = String(doc.outletId);
      if (map.has(key)) {
        const e = map.get(key);
        e.totalSale = (e.totalSale || 0) + (doc.totalSale || 0);
        e.confirmedOrders = (e.confirmedOrders || 0) + (doc.confirmedOrders || 0);
        e.canceledOrders = (e.canceledOrders || 0) + (doc.canceledOrders || 0);
        e.cogs = +((e.cogs || 0) + (doc.cogs || 0)).toFixed(2);
      } else {
        map.set(key, { ...doc });
      }
    }
  }

  for (const r of map.values()) {
    yield {
      outletName: r.outletName,
      totalSale: r.totalSale,
      confirmedOrders: r.confirmedOrders,
      canceledOrders: r.canceledOrders,
      cogs: +(r.cogs || 0).toFixed(2),
      profit: +((r.totalSale || 0) - (r.cogs || 0)).toFixed(2),
    };
  }
}

export async function* fetchConsumptionReport({ tenantId, outletId, fromDate, toDate }) {
  const match = {
    "tenant.tenantId": tenantId,
    createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    reason: "ORDER",
  };

  if (outletId) {
    match["outlet.outletId"] = new mongoose.Types.ObjectId(outletId);
  }

  const cursor = StockMovement.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$ingredient.ingredientMasterId",
        ingredientName: { $first: "$ingredient.ingredientMasterName" },
        totalQty: { $sum: "$quantity" },
        unit: { $first: "$unit" },
        noOfOrders: { $sum: 1 },
        totalCost: { $sum: { $multiply: ["$quantity", "$unitCost"] } },
      },
    },
    {
      $project: {
        _id: 0,
        ingredientName: 1,
        totalQty: { $round: ["$totalQty", 2] },
        unit: 1,
        noOfOrders: 1,
        totalCost: { $round: ["$totalCost", 2] },
        avgQtyPerOrder: {
          $cond: [
            { $gt: ["$noOfOrders", 0] },
            { $round: [{ $divide: ["$totalQty", "$noOfOrders"] }, 2] },
            0,
          ],
        },
        avgCostPerOrder: {
          $cond: [
            { $gt: ["$noOfOrders", 0] },
            { $round: [{ $divide: ["$totalCost", "$noOfOrders"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { totalCost: -1 } },
  ]).cursor();

  for await (const doc of cursor) {
    yield doc;
  }
}

export async function* generateReportRows({ reportType, tenantId, outletId, fromDate, toDate }) {
  const tenantObjId = new mongoose.Types.ObjectId(tenantId);

  switch (reportType) {
    case "profit":
      yield* fetchProfitReport({ tenantId: tenantObjId, outletId, fromDate, toDate });
      break;
    case "sales":
      yield* fetchSalesReport({ tenantId: tenantObjId, fromDate, toDate });
      break;
    case "consumption":
      yield* fetchConsumptionReport({ tenantId: tenantObjId, outletId, fromDate, toDate });
      break;
    default:
      throw new Error(`Unknown reportType: ${reportType}`);
  }
}
