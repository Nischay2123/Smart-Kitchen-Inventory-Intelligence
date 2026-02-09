import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { useGetStockMovementDetailsQuery } from '@/redux/apis/outlet-manager/stockMovementApi'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardDateRangePicker from "@/components/data-range-picker";
import { restockColumn } from '@/utils/columns/outlet-manager'
import { SkeletonLoader } from '@/components/laoder'

export const Restocks = () => {
  const navigate = useNavigate()

  const [dateRange, setDateRange] = React.useState(null);
  

  const {
    data,
    isLoading,
    isError,
    isFetching
  } = useGetStockMovementDetailsQuery({
      fromDate: dateRange?.from,
      toDate: dateRange?.to,
    },{skip:!dateRange})

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
        {(isLoading || isFetching) ? (
          <SkeletonLoader />
        ) : (
          <DataCard
            title="Stock Movement Entries"
            searchable
            loading={isLoading}
            columns={restockColumn(navigate)}
            data={data?.data ?? []}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
            pagination={true}
          />
        )}
      </div>
    </div>
  )
}

