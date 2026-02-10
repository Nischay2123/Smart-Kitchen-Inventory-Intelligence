import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DataCard from "@/components/data-card/data-card";
import SiteHeader from "@/components/site-header";

import { useGetStockDetailsQuery } from "@/redux/apis/outlet-manager/stocksApi";
import {
  setStocks,
  updateStockInStore,
} from "@/redux/reducers/outlet-manager/stockSlice";

import { useAuth } from "@/auth/auth";
import { useStockSocket } from "@/sockets/sockets";
import { CreateStockMovementForm } from "@/components/Form/outlet-manager-form/create-stock-movement";
import { ingredientColumn } from "@/utils/columns/outlet-manager";
import { SkeletonLoader } from "@/components/laoder";

import {debounce} from "lodash";

export const Stocks = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const ingredientStocks = useSelector(
    (state) => state.Stock.list
  );

  const { data, isLoading, isFetching, refetch } =
    useGetStockDetailsQuery({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search,
    });

  const [open, setOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  React.useEffect(() => {
    if (data?.data) {
      dispatch(setStocks(data.data.stocks));
    }
  }, [data, dispatch]);

  useStockSocket({
    tenantId: user?.tenant?.tenantId,
    outletId: user?.outlet?.outletId,
    onUpdate: (stock) => {
      dispatch(updateStockInStore(stock));
    },
  });

  const debouncedSearch = React.useMemo(
    () =>
      debounce((value) => {
        setPagination((prev) => ({
          ...prev,
          pageIndex: 0, 
        }));

        setSearch(value);
      }, 400),
    []
  );

  React.useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

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

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {isLoading  ? (
          <SkeletonLoader />
        ) : (
          <DataCard
            title="Available Stock"
            searchable
            columns={ingredientColumn(
              setOpen,
              setSelectedIngredient
            )}
            data={ingredientStocks ?? []}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
            pagination={true}
            manualPagination={true}
            pageCount={
              data?.data?.pagination?.totalPages || 0
            }
            onPaginationChange={setPagination}
            paginationState={pagination}
            onGlobalFilterChange={debouncedSearch}
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
