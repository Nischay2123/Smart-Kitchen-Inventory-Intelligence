import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { useGetSaleDetailsQuery } from '@/redux/apis/outlet-manager/saleApi'
import {useSalesSocket} from '@/sockets/sockets'
import React, { useCallback, useState ,useEffect} from 'react'
import { useNavigate } from 'react-router-dom'


const orderColumns = () => [
  {
    accessorKey: "requestId",
    header: "Request ID",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.requestId}
      </span>
    ),
  },

  {
    header: "Order Price",
    cell: ({ row }) => {
      const total = row.original.items.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      return <span>₹ {total.toFixed(2)}</span>;
    },
  },

  {
    header: "Making Cost",
    cell: ({ row }) => {
      const cost = row.original.items.reduce(
        (sum, item) => sum + item.makingCost,
        0
      );

      return <span>₹ {cost.toFixed(2)}</span>;
    },
  },

  {
    accessorKey: "state",
    header: "Status",
    // cell: ({ row }) => (
    //   <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
    //     {row.original.state}
    //   </span>
    // ),
    cell:({row})=>{
      const status = row.original.state;
      const statusColor ={
        CANCELED: "bg-red-100 text-red-500",
        CONFIRMED:"bg-green-100 text-green-700"
      }
      return (
        <span className={`px-2 py-1 rounded ${statusColor[status]}  text-xs`}>
          {status}
        </span>
      )
    }
  },
];



export const Orders = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user"))
  const tenantId = user.tenant.tenantId
  const outletId = user.outlet.outletId

  const {
    data,
    isLoading,
    refetch,
  } = useGetSaleDetailsQuery()

  const [orders, setOrders] = useState([])

  
  useEffect(() => {
    if (data?.data) {
      setOrders(data.data)
    }
  }, [data])

  const handleSocketCreate = useCallback((newDoc) => {
    console.log(newDoc);
    
    setOrders(prev => {
      const exists = prev.some(item => item._id === newDoc._id)
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
  
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <SiteHeader
        headerTitle="Stock Movements"
        description="stock movements of the ingredients"
        isTooltip={false}
      />

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataCard
            title="Stock Movement Entries"
            searchable
            loading={isLoading}
            columns={orderColumns()}
            data={orders}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
            pagination={true}
          />
        )}
      </div>
    </div>
  )
}

