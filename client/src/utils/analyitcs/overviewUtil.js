export const aggregateData = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return null;

  let totals = {
    cogs: 0,
    totalSale: 0,
    confirmedOrders: 0,
    canceledOrders: 0,
  };

  dataArray.forEach((item) => {
    totals.cogs += item.cogs || 0;
    totals.totalSale += item.totalSale || 0;
    totals.confirmedOrders += item.confirmedOrders || 0;
    totals.canceledOrders += item.canceledOrders || 0;
  });

  const totalOrders =
    totals.confirmedOrders + totals.canceledOrders;

  const totalProfit = totals.totalSale - totals.cogs;

  return {
    cogs: totals.cogs,
    totalSale: totals.totalSale,
    totalOrder: totals.confirmedOrders,
    totalBillCanceled: totals.canceledOrders,
    totalProfit,

    averagePerOrder:
      totals.confirmedOrders > 0
        ? totals.totalSale / totals.confirmedOrders
        : 0,

    cancelRate:
      totalOrders > 0
        ? (totals.canceledOrders / totalOrders) * 100
        : 0,

    profitMargin:
      totals.totalSale > 0
        ? (totalProfit / totals.totalSale) * 100
        : 0,

    revenueContribution: 100,
  };
};




export const chunkArray = (arr, size = 250) => {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
};



export const mergeAnalytics = (snapshot = [], live = []) => {
  const map = new Map();

  const insert = (row) => {
    const id = row.outletId.toString();

    if (!map.has(id)) {
      map.set(id, {
        outletId: row.outletId,
        outletName: row.outletName,
        totalSale: 0,
        confirmedOrders: 0,
        canceledOrders: 0,
        cogs: 0,
      });
    }

    const prev = map.get(id);

    prev.totalSale += row.totalSale || 0;
    prev.confirmedOrders += row.confirmedOrders || 0;
    prev.canceledOrders += row.canceledOrders || 0;
    prev.cogs += row.cogs || 0;
  };

  snapshot.forEach(insert);
  live.forEach(insert);

  const result = Array.from(map.values());

  const brandSale = result.reduce(
    (sum, r) => sum + r.totalSale,
    0
  );

  result.forEach((r) => {
    const totalOrders =
      r.confirmedOrders + r.canceledOrders;

    const profit = r.totalSale - r.cogs;

    r.totalProfit = profit;

    r.averagePerOrder =
      r.confirmedOrders > 0
        ? r.totalSale / r.confirmedOrders
        : 0;

    r.cancelRate =
      totalOrders > 0
        ? (r.canceledOrders / totalOrders) * 100
        : 0;

    r.profitMargin =
      r.totalSale > 0
        ? (profit / r.totalSale) * 100
        : 0;

    r.revenueContribution =
      brandSale > 0
        ? (r.totalSale / brandSale) * 100
        : 0;
  });

  return result;
};
