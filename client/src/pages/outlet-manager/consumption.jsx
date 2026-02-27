import React from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import DataCard from "@/components/data-card/data-card";
import SiteHeader from "@/components/site-header";
import DashboardDateRangePicker from "@/components/data-range-picker";
import ExportBanner from "@/components/export-banner";

import { useGetSaleStockConsumptionQuery } from "@/redux/apis/outlet-manager/stockMovementApi";
import { useRequestReportExportMutation } from "@/redux/apis/brand-admin/analyticsApi";
import {
  setStocks,
  updateStockInStore,
} from "@/redux/reducers/outlet-manager/stockSlice";

import { useAuth } from "@/auth/auth";
import { useStockSocket } from "@/sockets/sockets";
import { SkeletonLoader } from "@/components/laoder";

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

export const Consumption = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [dateRange, setDateRange] = React.useState(null);

  const rangeOver30 = isOver30Days(dateRange?.from, dateRange?.to);

  const [requestReportExport, { isLoading: exportLoading }] =
    useRequestReportExportMutation();

  const handleConsumptionExport = async (email) => {
    try {
      await requestReportExport({
        from: dateRange?.from,
        to: dateRange?.to,
        outletId: user?.outlet?.outletId,
        email,
        type: "consumption",
      }).unwrap();
      toast.success("Report generation started! You'll receive an email when it's ready.");
    } catch {
      toast.error("Failed to trigger export. Please try again.");
    }
  };

  const { data, isLoading, refetch, isFetching } =
    useGetSaleStockConsumptionQuery({
      fromDate: dateRange?.from,
      toDate: dateRange?.to,
    }, { skip: !dateRange });

  React.useEffect(() => {
    if (data?.data) {
      dispatch(setStocks(data.data));
    }
  }, [data, dispatch]);

  useStockSocket({
    tenantId: user?.tenant?.tenantId,
    outletId: user?.outlet?.outletId,
    onUpdate: (stock) => {
      dispatch(updateStockInStore(stock));
    },
  });

  return (
    <div className="w-full bg-gray-50 min-h-screen overflow-x-hidden">
      <SiteHeader
        headerTitle="Consumption"
        description="Consumption of the ingredients in this outlet for the selected time frame"
        isTooltip={false}
        isRefetch={true}
        onRefetch={refetch}
        isFetching={isFetching}
        actionTooltip="Refetch"
      />

      <DashboardDateRangePicker
        value={dateRange}
        onChange={setDateRange}
        className="px-4 lg:px-6 mt-4"
      />

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {rangeOver30 ? (
          <ExportBanner
            label="Consumption"
            onExport={handleConsumptionExport}
            isLoading={exportLoading}
          />
        ) : (isLoading || isFetching) ? (
          <SkeletonLoader />
        ) : (
          <DataCard
            title="Available Stock"
            searchable={true}
            columns={ingredientColumn()}
            data={data?.data ?? []}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
            pagination={true}
          />
        )}
      </div>

    </div>
  );
};
