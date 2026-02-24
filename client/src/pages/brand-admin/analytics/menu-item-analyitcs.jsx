import { useSelector } from "react-redux";
import AnalyticsHeader from "@/components/AnalyticsHeader";
import { useGetMenuMatrixDataQuery, useGetMenuItemDataQuery } from "@/redux/apis/brand-admin/analyticsApi";
import MenuEngineeringMatrix from "@/components/menu-matrix";
import DataCard from "@/components/data-card/data-card";
import { SkeletonLoader, GridLoader } from '@/components/laoder';

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
    cell: ({ getValue }) => `₹${getValue().toFixed(2)}`,
  },
  {
    accessorKey: "profitMargin",
    header: "Profit Margin (%)",
    cell: ({ getValue }) => `${getValue().toFixed(2)}%`,
  },
];

export const MenuItemAnalysis = () => {
  const { from, to } = useSelector((state) => state.dashboardFilters.dateRange);
  const outletId = useSelector((state) => state.dashboardFilters.outletId);
  const { data, isLoading, isError, refetch } = useGetMenuMatrixDataQuery(
    { from, to },
    { skip: !from || !to }
  );
  const { data: outletData, isLoading: outletDataLoading, isError: isOutletDataError, refetch: outletDataRefetch } = useGetMenuItemDataQuery(
    { from, to, outletId },
    { skip: !from || !to || !outletId }
  );



  return (
    <div className="w-full bg-gray-50 min-h-screen pb-4">
      <AnalyticsHeader
        headerTitle="Sales Analytics"
        description="Live performance insights across all outlets"
        isRefreshing={isLoading || outletDataLoading}
        onRefresh={() => {
          refetch()
          outletDataRefetch()
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
            data={outletData?.data ?? []}
            columns={outletColumns}
          />
        )}
      </div>
    </div>
  );
};
