import CancelIngredientsDialog from '@/components/canceled-ingredient'
import DataCard from '@/components/data-card/data-card'
import OrderDetailsModal from '@/components/OrderDetailsModal'
import SiteHeader from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { useGetSaleDetailsQuery } from '@/redux/apis/outlet-manager/saleApi'
import {useSalesSocket} from '@/sockets/sockets'
import React, { useCallback, useState ,useEffect} from 'react'
import DashboardDateRangePicker from "@/components/data-range-picker";


const orderColumns = (onView) => [
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => (
      <span className="font-medium">{`${new Date(row.original.createdAt).toLocaleDateString()} - ${new Date(row.original.createdAt).toLocaleTimeString()}`}</span>
    ),
  },

  {
    header: "Order Price",
    cell: ({ row }) => {
      const total = row.original.items.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      )
      return <span>₹ {total.toFixed(2)}</span>
    },
  },

  {
    header: "Making Cost",
    cell: ({ row }) => {
      const cost = row.original.items.reduce(
        (sum, item) => sum + item.makingCost,
        0
      )
      return <span>₹ {cost.toFixed(2)}</span>
    },
  },

  {
    accessorKey: "state",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.state
      const statusColor = {
        CANCELED: "bg-red-100 text-red-500",
        CONFIRMED: "bg-green-100 text-green-700",
      }

      return (
        <span className={`px-2 py-1 rounded text-xs ${statusColor[status]}`}>
          {status}
        </span>
      )
    },
  },

  {
    header: "Action",
    cell: ({ row }) => (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onView(row.original)}
      >
        View
      </Button>
    ),
  },
]







export const Orders = () => {
  const user = JSON.parse(localStorage.getItem("user"))
  const tenantId = user.tenant.tenantId
  const outletId = user.outlet.outletId
  const [dateRange, setDateRange] = React.useState(null);


  const { data, isLoading, refetch } = useGetSaleDetailsQuery({
      fromDate: dateRange?.from,
      toDate: dateRange?.to,
    },{skip:!dateRange})
  const [orders, setOrders] = useState([])

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCanceledModalOpen, setIsCanceledModalOpen] = useState(false)
  const[isCanceled,setISCancled] = useState(false)
  

  useEffect(() => {
    if (data?.data) {
      setOrders(data.data)
    }
  }, [data])

  const handleSocketCreate = useCallback((newDoc) => {
    console.log(newDoc);
    
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
    if (order.state=="CANCELED") {
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
            title="Orders"
            searchable
            loading={isLoading}
            columns={orderColumns(handleViewOrder)}
            data={orders}
            pagination
          />
        )}
      </div>

      {isCanceled? 
      <CancelIngredientsDialog
       items={selectedOrder}
       onClose={()=>setIsCanceledModalOpen(false)}
       open={isCanceledModalOpen} />
        :<OrderDetailsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        isLoading={isLoading}
      />}
    </div>
  )
}
