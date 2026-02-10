import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { useGetSaleStockMovementDetailsQuery } from '@/redux/apis/outlet-manager/stockMovementApi'
import { useStockMovementSocket } from '@/sockets/sockets'
import React, { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardDateRangePicker from "@/components/data-range-picker";
import { stockMovementColumn } from '@/utils/columns/outlet-manager'
import { SkeletonLoader } from '@/components/laoder'
import { debounce } from 'lodash'

export const StockMovement = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user"))
  const tenantId = user.tenant.tenantId
  const outletId = user.outlet.outletId
  const [dateRange, setDateRange] = React.useState(null);
  const [search, setSearch] = useState("");
  


  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetSaleStockMovementDetailsQuery({
    fromDate: dateRange?.from,
    toDate: dateRange?.to,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search
  }, { skip: !dateRange })

  const [stockMovements, setStockMovements] = useState([])


  useEffect(() => {
    if (data?.data?.movements) {
      setStockMovements(data.data.movements)
    } else if (Array.isArray(data?.data)) {
      setStockMovements(data.data)
    }
  }, [data])

  const handleSocketCreate = useCallback((newDoc) => {
    // console.log(newDoc);

    setStockMovements(prev => {
      const exists = prev.some(item => item._id === newDoc._id)
      if (exists) return prev

      return [newDoc, ...prev]
    })
  }, [])

  const handleSocketError = useCallback(() => {
    refetch()
  }, [refetch])

  useStockMovementSocket({
    tenantId,
    outletId,
    onCreate: handleSocketCreate,
    onError: handleSocketError,
  })

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
        headerTitle="Stock Movements"
        description="stock movements of the ingredients"
        isTooltip={false}
      />

      <DashboardDateRangePicker
        value={dateRange}
        onChange={setDateRange}
        className="px-4 lg:px-6 mt-4"
      />

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {(isLoading ) ? (
          <SkeletonLoader />
        ) : (
          <DataCard
            title="Stock Movement Entries"
            searchable
            loading={isLoading || isFetching}
            columns={stockMovementColumn(navigate)}
            data={stockMovements}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
            pagination={true}
            manualPagination={true}
            pageCount={data?.data?.pagination?.totalPages || 0}
            onPaginationChange={setPagination}
            paginationState={pagination}
            onGlobalFilterChange={debouncedSearch}
          />
        )}
      </div>
    </div>
  )
}

