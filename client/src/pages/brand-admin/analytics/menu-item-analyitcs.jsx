import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import AnalyticsHeader from "@/components/AnalyticsHeader";
import MenuEngineeringMatrix from "@/components/menu-matrix";
import DataCard from "@/components/data-card/data-card";
import ExportBanner from "@/components/export-banner";
import { SkeletonLoader } from "@/components/laoder";

import {
  useGetMenuMatrixDataQuery,
  useGetItemSnapshotDataMutation,
  useGetItemLiveDataMutation,
  useRequestReportExportMutation,
} from "@/redux/apis/brand-admin/analyticsApi";
import { useGetSaleStockConsumptionQuery } from "@/redux/apis/outlet-manager/stockMovementApi";

import { mergeItemAnalytics } from "@/utils/analyitcs/itemAnalyticsUtil";

const isTodayInRange = (from, to) => {
  const today = new Date();
  const f = new Date(from);
  const t = new Date(to);
  f.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return today >= f && today <= t;
};

const isPastInRange = (from) => {
  const today = new Date();
  const f = new Date(from);
  f.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return f < today;
};

const outletColumns = [
  { accessorKey: "itemName", header: "Item" },
  { accessorKey: "totalQty", header: "Qty Sold" },
  {
    accessorKey: "totalRevenue",
    header: "Total Revenue",
    cell: ({ getValue }) => `₹${getValue()}`,
  },
  {
    accessorKey: "totalMakingCost",
    header: "Making Cost",
    cell: ({ getValue }) => `₹${getValue().toFixed(2)}`,
  },
  {
    accessorKey: "profit",
    header: "Profit",
    cell: ({ row }) =>
      `₹${(row.original.totalRevenue - row.original.totalMakingCost).toFixed(2)}`,
  },
  {
    accessorKey: "profitMargin",
    header: "Profit Margin (%)",
    cell: ({ row }) => {
      const { totalRevenue, totalMakingCost } = row.original;
      const profit = totalRevenue - totalMakingCost;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      return `${margin.toFixed(2)}%`;
    },
  },
];

const isOver30Days = (from, to) => {
  if (!from || !to) return false;
  return (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24) > 30;
};

const ingredientColumn = () => [
  { accessorKey: "ingredientName", header: "Ingredient" },
  {
    accessorKey: "totalCost", header: "Total Cost", cell: ({ row }) => (
      <span>{row.original.totalCost.toFixed(3)}</span>
    )
  },
  { accessorKey: "noOfOrders", header: "Used In Orders" },
  { accessorKey: "avgQtyPerOrder", header: "Average Quantity Used Per Order" },
  { accessorKey: "avgCostPerOrder", header: "Average Cost Per Order" },
  { accessorKey: "totalQty", header: "Total Consumption" },
  { accessorKey: "unit", header: "Unit" },
];

export const MenuItemAnalysis = () => {
  const { from, to } = useSelector((state) => state.dashboardFilters.dateRange);
  const outletId = useSelector((state) => state.dashboardFilters.outletId);

  const rangeOver30 = isOver30Days(from, to);

  const { data, isLoading, refetch } = useGetMenuMatrixDataQuery(
    { from, to, outletId },
    { skip: !from || !to || rangeOver30 || !outletId }
  );

  const [getItemSnapshotData] = useGetItemSnapshotDataMutation();
  const [getItemLiveData] = useGetItemLiveDataMutation();

  const [outletData, setOutletData] = useState([]);
  const [outletDataLoading, setOutletDataLoading] = useState(false);

  const loadItemData = async () => {
    try {
      if (!outletId || !from || !to || rangeOver30) return;

      setOutletDataLoading(true);

      const includeLive = isTodayInRange(from, to);
      const includePast = isPastInRange(from);

      let snapshotData = [];
      let liveData = [];

      if (includePast) {
        const snapshot = await getItemSnapshotData({ outletId, from, to }).unwrap();
        snapshotData = snapshot?.data ?? [];
      }

      if (includeLive) {
        const live = await getItemLiveData({ outletId }).unwrap();
        liveData = live?.data ?? [];
      }

      let merged = [];
      if (includePast && includeLive) {
        merged = mergeItemAnalytics(snapshotData, liveData);
      } else if (includePast) {
        merged = mergeItemAnalytics(snapshotData);
      } else if (includeLive) {
        merged = mergeItemAnalytics(liveData);
      }

      setOutletData(merged);
    } catch (err) {
      console.error("Item analytics loading failed", err);
    } finally {
      setOutletDataLoading(false);
    }
  };

  useEffect(() => {
    if (!outletId || !from || !to || rangeOver30) return;
    loadItemData();
  }, [outletId, from, to]);

  const [requestReportExport, { isLoading: exportLoading }] =
    useRequestReportExportMutation();

  const handleProfitExport = async (email) => {
    try {
      await requestReportExport({
        from, to, outletId, email, type: "profit",
      }).unwrap();
      toast.success("Item profit report generation started! You'll receive an email when it's ready.");
    } catch {
      toast.error("Failed to trigger export. Please try again.");
    }
  };

  const handleConsumptionExport = async (email) => {
    try {
      await requestReportExport({
        from, to, outletId, email, type: "consumption",
      }).unwrap();
      toast.success("Consumption report generation started! You'll receive an email when it's ready.");
    } catch {
      toast.error("Failed to trigger consumption export. Please try again.");
    }
  };

  const { data: consumptionData, isLoading: consumptionLoading, isFetching: consumptionFetching } =
    useGetSaleStockConsumptionQuery({
      fromDate: from,
      toDate: to,
      outletId,
    }, { skip: !from || !to || !outletId || rangeOver30 });

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-4 overflow-x-hidden">
      <AnalyticsHeader
        headerTitle="Sales Analytics"
        description="Live performance insights across all outlets"
        isRefreshing={isLoading || outletDataLoading}
        onRefresh={() => {
          if (!rangeOver30) {
            refetch();
            loadItemData();
          }
        }}
      />

      {rangeOver30 ? (
        <div className="px-6 pt-2 gap-4 flex flex-col">
          <ExportBanner
            label="Menu Item Profit"
            onExport={handleProfitExport}
            isLoading={exportLoading}
          />
          <ExportBanner
            label="Consumption Report"
            onExport={handleConsumptionExport}
            isLoading={exportLoading}
          />
        </div>
      ) : (
        <>
          <div className="px-6 pt-2">
            {isLoading || !data ? (
              <SkeletonLoader />
            ) : (
              <MenuEngineeringMatrix data={data?.data ?? []} />
            )}
          </div>

          <div className="flex-1 min-h-0 p-4 lg:p-6">
            {outletDataLoading ? (
              <SkeletonLoader />
            ) : (
               <DataCard
                description="Per outlet sales and contribution"
                title="Menu Item Data"
                data={outletData ?? []}
                columns={outletColumns}
              />
            )}
          </div>
          <div className="flex-1 min-h-0 p-4 lg:p-6">
            {outletDataLoading ? (
              <SkeletonLoader />
            ) : (
               <DataCard
                title="Stock Consumption Data"
                description="Per outlet ingredient consumption based on orders in the selected time frame"
                searchable={true}
                columns={ingredientColumn()}
                data={consumptionData?.data ?? []}
                titleWhenEmpty="No ingredients found"
                pagination={true}
              />
            )}
          </div>

        </>
      )}
    </div>
  );
};
