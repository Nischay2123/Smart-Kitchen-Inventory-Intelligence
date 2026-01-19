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
import { CreateStockMovementForm } from "@/components/Form/outlet-manager-form/create-stock-movement";

/* -------------------- TABLE COLUMNS -------------------- */

const ingredientColumn = (setOpen, setSelectedIngredient) => [
  {
    accessorKey: "ingredientName",
    header: "Ingredient",
  },

  {
    accessorKey: "currentStockInBase",
    header: "Current Stock",
  },

  {
    accessorKey: "baseUnit",
    header: "Unit",
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

          // 👇 PASS DATA TO MODAL
          setSelectedIngredient({
            ingredientMasterId: row.original.ingredientId,
            ingredientName: row.original.ingredientName,
            unit: row.original.unit,
          });

          setOpen(true);
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

  const [open, setOpen] = React.useState(false);
  const [selectedIngredient, setSelectedIngredient] = React.useState(null);

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
            columns={ingredientColumn(setOpen,setSelectedIngredient)}
            data={ingredientStocks ?? []}
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

export default Stocks;
