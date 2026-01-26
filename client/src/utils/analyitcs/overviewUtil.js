export const aggregateData = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return null;

  const aggregated = {
    cogs: 0,
    totalSale: 0,
    totalOrder: 0,
    totalBillCanceled: 0,
    totalProfit: 0,
    totalAveragePerCover: 0,
    totalCancelRate: 0,
    totalProfitMargin: 0,
    totalRevenueContribution: 0,
  };

  dataArray.forEach(item => {
    aggregated.cogs += item.cogs || 0;
    aggregated.totalSale += item.totalSale || 0;
    aggregated.totalOrder += item.totalOrder || 0;
    aggregated.totalBillCanceled += item.totalBillCanceled || 0;
    aggregated.totalProfit += item.totalProfit || 0;
    aggregated.totalAveragePerCover += item.averagePerCover || 0;
    aggregated.totalCancelRate += item.cancelRate || 0;
    aggregated.totalProfitMargin += item.profitMargin || 0;
    aggregated.totalRevenueContribution += item.revenueContribution || 0;
  });

  const n = dataArray.length;

  return {
    cogs: aggregated.cogs,
    totalSale: aggregated.totalSale,
    totalOrder: aggregated.totalOrder,
    totalBillCanceled: aggregated.totalBillCanceled,
    totalProfit: aggregated.totalProfit,
    averagePerCover: aggregated.totalAveragePerCover / n,
    cancelRate: aggregated.totalCancelRate / n,
    profitMargin: aggregated.totalProfitMargin / n,
    revenueContribution: aggregated.totalRevenueContribution / n,
  };
};
