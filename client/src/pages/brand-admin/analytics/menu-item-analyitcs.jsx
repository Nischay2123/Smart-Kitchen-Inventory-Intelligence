import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import AnalyticsHeader from "@/components/AnalyticsHeader";
import MenuEngineeringMatrix from "@/components/menu-matrix";
import DataCard from "@/components/data-card/data-card";
import { SkeletonLoader } from "@/components/laoder";

import {
  useGetMenuMatrixDataQuery,
  useGetItemSnapshotDataMutation,
  useGetItemLiveDataMutation,
} from "@/redux/apis/brand-admin/analyticsApi";

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
  {
    accessorKey: "itemName",
    header: "Item",
  },
  {
    accessorKey: "totalQty",
    header: "Qty Sold",
  },
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


export const MenuItemAnalysis = () => {
  const { from, to } = useSelector((state) => state.dashboardFilters.dateRange);
  const outletId = useSelector((state) => state.dashboardFilters.outletId);

  const { data, isLoading, refetch } = useGetMenuMatrixDataQuery(
    { from, to, outletId },
    { skip: !from || !to }
  );


  const [getItemSnapshotData] = useGetItemSnapshotDataMutation();
  const [getItemLiveData] = useGetItemLiveDataMutation();

  const [outletData, setOutletData] = useState([]);
  const [outletDataLoading, setOutletDataLoading] = useState(false);
  const loadItemData = async () => {
    try {
      if (!outletId || !from || !to) return;

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
    if (!outletId || !from || !to) return;
    loadItemData();
  }, [outletId, from, to]);

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-4">
      <AnalyticsHeader
        headerTitle="Sales Analytics"
        description="Live performance insights across all outlets"
        isRefreshing={isLoading || outletDataLoading}
        onRefresh={() => {
          refetch();
          loadItemData();
        }}
      />
      <div className="px-6">
        {isLoading || !data ? (
          <SkeletonLoader />
        ) : (
          <MenuEngineeringMatrix data={data?.data ?? []} />
        )}
      </div>
      <div className="flex flex-col gap-4 px-4 lg:px-6 lg:flex-row pt-4">
        {outletDataLoading ? (
          <SkeletonLoader />
        ) : (
          <DataCard
            description="Per outlet sales and contribution"
            title={"Outlet Data"}
            data={outletData ?? []}
            columns={outletColumns}
          />
        )}
      </div>
    </div>
  );
};
