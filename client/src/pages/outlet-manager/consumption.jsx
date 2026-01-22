import React from "react";
import { useDispatch } from "react-redux";

import DataCard from "@/components/data-card/data-card";
import SiteHeader from "@/components/site-header";

import { useGetSaleStockConsumptionQuery } from "@/redux/apis/outlet-manager/stockMovementApi";
import { setStocks, updateStockInStore } from "@/redux/reducers/outlet-manager/stockSlice";

import { useAuth } from "@/auth/auth";
import { useStockSocket } from "@/sockets/sockets";
import { CreateStockMovementForm } from "@/components/Form/outlet-manager-form/create-stock-movement";


const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

const ingredientColumn = () => [
  {
    accessorKey: "ingredientName",
    header: "Ingredient",
  },

  {
    accessorKey: "totalConsumed",
    header: "Total Consumption",
  },

  {
    accessorKey: "unit",
    header: "Unit",
  },

];



export const Consumption = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();


    const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);


  const [fromDate, setFromDate] = React.useState(formatDate(today));
  const [toDate, setToDate] = React.useState(formatDate(tomorrow));


  const { data, isLoading, refetch } = useGetSaleStockConsumptionQuery({
    fromDate,toDate
  });

  const [open, setOpen] = React.useState(false);
  const [selectedIngredient, setSelectedIngredient] = React.useState(null);





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
      <div className="flex flex-wrap gap-4 px-4 lg:px-6 mt-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

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


      <CreateStockMovementForm
        open={open}
        onOpenChange={setOpen}
        ingredient={selectedIngredient}
      />

    </div>
  );
};

