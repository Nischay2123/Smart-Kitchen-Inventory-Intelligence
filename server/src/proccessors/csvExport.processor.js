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

const endOfDay = (d) => {
  const date = new Date(d);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const todayStart = () => startOfDay(new Date());

const isTodayInRange = (from, to) => {
  const today = startOfDay(new Date());
  return today >= startOfDay(from) && today <= startOfDay(to);
};

const isPastInRange = (from) => {
  return startOfDay(from) < todayStart();
};

const mergeByKey = (snapshotRows, liveRows, keyField) => {
  const map = new Map();

  for (const row of snapshotRows) {
    map.set(String(row[keyField]), { ...row });
  }

  for (const row of liveRows) {
    const key = String(row[keyField]);
    if (map.has(key)) {
      const existing = map.get(key);
      for (const field of Object.keys(row)) {
        if (typeof row[field] === "number" && field !== keyField) {
          existing[field] = (existing[field] || 0) + row[field];
        }
      }
    } else {
      map.set(key, { ...row });
    }
  }

  return [...map.values()];
};


async function profitSnapshot({ tenantId, outletId, fromDate, toDate }) {
  const outletObjId = new mongoose.Types.ObjectId(outletId);
  const snapshotEnd = startOfDay(toDate);
  // snapshot covers all days BEFORE today
  const snapshotStart = startOfDay(fromDate);

  return OutletItemDailySnapshot.aggregate([
    {
      $match: {
        "tenant.tenantId": tenantId,
        "outlet.outletId": outletObjId,
        date: { $gte: snapshotStart, $lte: snapshotEnd },
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
  ]);
}

async function profitLive({ tenantId, outletId }) {
  const outletObjId = new mongoose.Types.ObjectId(outletId);

  return Sale.aggregate([
    {
      $match: {
        "tenant.tenantId": tenantId,
        "outlet.outletId": outletObjId,
        createdAt: { $gte: todayStart() },
        state: "CONFIRMED",
      },
    },
    { $project: { items: 1 } },
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
  ]);
}

export async function fetchProfitReport({ tenantId, outletId, fromDate, toDate }) {
  const includePast = isPastInRange(fromDate);
  const includeLive = isTodayInRange(fromDate, toDate);

  let snapshotData = [];
  let liveData = [];

  if (includePast) {
    snapshotData = await profitSnapshot({ tenantId, outletId, fromDate, toDate });
  }
  if (includeLive) {
    liveData = await profitLive({ tenantId, outletId });
  }

  const merged = mergeByKey(snapshotData, liveData, "itemId");

  return merged.map((r) => {
    const profit = +(r.totalRevenue - r.totalMakingCost).toFixed(2);
    const profitMargin = r.totalRevenue > 0
      ? +(((profit / r.totalRevenue) * 100).toFixed(2))
      : 0;
    return {
      itemName: r.itemName,
      totalQty: r.totalQty,
      totalRevenue: r.totalRevenue,
      totalMakingCost: r.totalMakingCost,
      profit,
      profitMargin,
    };
  });
}

async function salesSnapshot({ tenantId, fromDate, toDate }) {
  return TenantDailySnapshot.aggregate([
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
  ]);
}

async function salesLive({ tenantId }) {
  return Sale.aggregate([
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
  ]);
}

export async function fetchSalesReport({ tenantId, fromDate, toDate }) {
  const includePast = isPastInRange(fromDate);
  const includeLive = isTodayInRange(fromDate, toDate);

  let snapshotData = [];
  let liveData = [];

  if (includePast) {
    snapshotData = await salesSnapshot({ tenantId, fromDate, toDate });
  }
  if (includeLive) {
    liveData = await salesLive({ tenantId });
  }

  const merged = mergeByKey(snapshotData, liveData, "outletId");

  return merged.map((r) => ({
    outletName: r.outletName,
    totalSale: r.totalSale,
    confirmedOrders: r.confirmedOrders,
    canceledOrders: r.canceledOrders,
    cogs: +(r.cogs || 0).toFixed(2),
    profit: +((r.totalSale || 0) - (r.cogs || 0)).toFixed(2),
  }));
}


export async function fetchConsumptionReport({ tenantId, outletId, fromDate, toDate }) {
  const match = {
    "tenant.tenantId": tenantId,
    createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    reason: "ORDER",
  };

  if (outletId) {
    match["outlet.outletId"] = new mongoose.Types.ObjectId(outletId);
  }

  return StockMovement.aggregate([
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
  ]);
}

export async function generateReportRows({ reportType, tenantId, outletId, fromDate, toDate }) {
  const tenantObjId = new mongoose.Types.ObjectId(tenantId);

  switch (reportType) {
    case "profit":
      return fetchProfitReport({ tenantId: tenantObjId, outletId, fromDate, toDate });
    case "sales":
      return fetchSalesReport({ tenantId: tenantObjId, fromDate, toDate });
    case "consumption":
      return fetchConsumptionReport({ tenantId: tenantObjId, outletId, fromDate, toDate });
    default:
      throw new Error(`Unknown reportType: ${reportType}`);
  }
}
