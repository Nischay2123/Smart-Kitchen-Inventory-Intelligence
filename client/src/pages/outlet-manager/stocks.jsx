import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import DataCard from "@/components/data-card/data-card";
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";

import { useGetStockDetailsQuery } from "@/redux/apis/outlet-manager/stocksApi";
import { setStocks, updateStockInStore } from "@/redux/reducers/outlet-manager/stockSlice";

import { useAuth } from "@/auth/auth";
import { useStockSocket } from "@/sockets/sockets";

/* -------------------- TABLE COLUMNS -------------------- */

const ingredientColumn = (navigate) => [
  {
    accessorKey: "ingredientName",
    header: "Ingredient",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.ingredientName}
      </span>
    ),
  },
  {
    accessorKey: "currentStockInBase",
    header: "Current Stock",
    cell: ({ row }) => (
      <span>{row.original.currentStockInBase}</span>
    ),
  },
  {
    accessorKey: "baseUnit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.baseUnit}
      </span>
    ),
  },
  {
    accessorKey: "alertState",
    header: "Status",
    cell: ({ row }) => {
      const state = row.original.alertState;

      const statusColor = {
        OK: "text-green-700",
        LOW: "text-yellow-700",
        CRITICAL: "text-red-700",
        NOT_INITIALIZED: "text-gray-600",
      };

      const statusBg = {
        OK: "bg-green-200",
        LOW: "bg-yellow-200",
        CRITICAL: "bg-red-200",
        NOT_INITIALIZED: "bg-gray-200",
      };

      return (
        <span
          className={`font-medium px-2 py-1 rounded ${statusColor[state]} ${statusBg[state]}`}
        >
          {state}
        </span>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          navigate("/restock");
        }}
      >
        Restock
      </Button>
    ),
  },
];

/* -------------------- PAGE -------------------- */

export const Stocks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  /* 🔥 Redux is the single source of truth */
  const ingredientStocks = useSelector(
    (state) => state.Stock.list
  );

  

  /* Initial REST snapshot */
  const { data, isLoading } = useGetStockDetailsQuery();

  React.useEffect(() => {
    if (data?.data) {
      dispatch(setStocks(data.data));
    }
  }, [data, dispatch]);

  /* 🔌 Real-time socket updates */
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
      />

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataCard
            title="Available Stock"
            searchable
            columns={ingredientColumn(navigate)}
            data={ingredientStocks ?? []}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
          />
        )}
      </div>
    </div>
  );
};

export default Stocks;
