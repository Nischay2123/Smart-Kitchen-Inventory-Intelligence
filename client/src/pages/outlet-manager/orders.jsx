import CancelIngredientsDialog from '@/components/canceled-ingredient'
import DataCard from '@/components/data-card/data-card'
import OrderDetailsModal from '@/components/OrderDetailsModal'
import SiteHeader from '@/components/site-header'
import { useGetSaleDetailsQuery } from '@/redux/apis/outlet-manager/saleApi'
import { useSalesSocket } from '@/sockets/sockets'
import React, { useCallback, useState, useEffect } from 'react'
import DashboardDateRangePicker from "@/components/data-range-picker";
import { orderColumns } from '@/utils/columns/outlet-manager'
import { SkeletonLoader, TableOverlayLoader } from '@/components/laoder'



const STATUS_OPTIONS = [
  { value: null, label: "All", color: "bg-gray-200 text-gray-700", activeColor: "bg-gray-700 text-white" },
  { value: "PENDING", label: "Pending", color: "bg-yellow-50 text-yellow-700", activeColor: "bg-yellow-500 text-white" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-green-50 text-green-700", activeColor: "bg-green-600 text-white" },
  { value: "CANCELED", label: "Canceled", color: "bg-red-50 text-red-500", activeColor: "bg-red-500 text-white" },
];

export const Orders = () => {
  const user = JSON.parse(localStorage.getItem("user"))
  const tenantId = user.tenant.tenantId
  const outletId = user.outlet.outletId
  const [dateRange, setDateRange] = React.useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const { data, isLoading, refetch, isFetching } = useGetSaleDetailsQuery({
    fromDate: dateRange?.from,
    toDate: dateRange?.to,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    state: statusFilter,
  }, { skip: !dateRange })
  const [orders, setOrders] = useState([])

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCanceledModalOpen, setIsCanceledModalOpen] = useState(false)
  const [isCanceled, setISCancled] = useState(false)


  useEffect(() => {
    if (data?.data) {
      setOrders(data.data.saleRecords)
    }
  }, [data])

  const handleSocketCreate = useCallback((newDoc) => {
    // console.log(newDoc);

    setOrders((prev) => {
      const exists = prev.some((item) => item._id === newDoc._id)
      if (exists) return prev
      return [newDoc, ...prev]
    })
  }, [])

  const handleSocketError = useCallback(() => {
    refetch()
  }, [refetch])

  useSalesSocket({
    tenantId,
    outletId,
    onCreate: handleSocketCreate,
    onError: handleSocketError,
  })

  const handleViewOrder = (order) => {
    if (order.state == "CANCELED") {
      setSelectedOrder(order.items)
      setISCancled(true);
      setIsCanceledModalOpen(true)
      return
    }
    setISCancled(false)
    setSelectedOrder(order.items)
    setIsModalOpen(true)
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <SiteHeader
        headerTitle="Orders"
        description="All outlet orders"
        isTooltip={false}
        isRefetch={true}
        onRefetch={refetch}
        isFetching={isFetching}
      />
      <DashboardDateRangePicker
        value={dateRange}
        onChange={setDateRange}
        className="px-4 lg:px-6 mt-4"
      />

      <div className="flex items-center gap-2 px-4 lg:px-6 mt-4">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleStatusChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${statusFilter === opt.value ? opt.activeColor : opt.color
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {(isLoading || isFetching) ? (
          <SkeletonLoader />
        ) : (
          <div className="relative">
            {(isFetching && !isLoading) && <TableOverlayLoader />}
            <DataCard
              title="Orders"
              searchable={false}
              columns={orderColumns(handleViewOrder)}
              data={orders}
              pagination
              manualPagination={true}
              pageCount={data?.data?.pagination?.totalPages || 0}
              onPaginationChange={setPagination}
              paginationState={pagination}
            />
          </div>
        )}
      </div>

      {isCanceled ?
        <CancelIngredientsDialog
          items={selectedOrder}
          onClose={() => setIsCanceledModalOpen(false)}
          open={isCanceledModalOpen} />
        : <OrderDetailsModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          order={selectedOrder}
          isLoading={isLoading}
        />}
    </div>
  )
}
