import React from "react";
import { useDispatch } from "react-redux";

import DataCard from "@/components/data-card/data-card";
import SiteHeader from "@/components/site-header";
import DashboardDateRangePicker from "@/components/data-range-picker";

import { useGetSaleStockConsumptionQuery } from "@/redux/apis/outlet-manager/stockMovementApi";
import {
  setStocks,
  updateStockInStore,
} from "@/redux/reducers/outlet-manager/stockSlice";

import { useAuth } from "@/auth/auth";
import { useStockSocket } from "@/sockets/sockets";

const ingredientColumn = () => [
  { accessorKey: "ingredientName", header: "Ingredient" },
  { accessorKey: "totalConsumed", header: "Total Consumption" },
  { accessorKey: "unit", header: "Unit" },
];

export const Consumption = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [dateRange, setDateRange] = React.useState(null);

  const { data, isLoading, refetch } =
    useGetSaleStockConsumptionQuery({
      fromDate: dateRange?.from,
      toDate: dateRange?.to,
    });
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
    <div className="w-full bg-gray-50 min-h-screen">
      <SiteHeader
        headerTitle="Stocks"
        description="Available stock for the ingredients in this outlet"
        isTooltip={false}
        isRefetch={true}
        onRefetch={refetch}
        actionTooltip="Refetch"
      />

      <DashboardDateRangePicker
        value={dateRange}
        onChange={setDateRange}
        className="px-4 lg:px-6 mt-4"
      />

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataCard
            title="Available Stock"
            searchable
            columns={ingredientColumn()}
            data={data?.data ?? []}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
          />
        )}
      </div>

    </div>
  );
};
