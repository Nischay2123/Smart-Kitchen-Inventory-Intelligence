import DataCard from '@/components/data-card/data-card'
import OrderDetailsModal from '@/components/OrderDetailsModal'
import SiteHeader from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { items } from '@/redux/apis/brand-admin/itemApi'
import { useGetSaleDetailsQuery } from '@/redux/apis/outlet-manager/saleApi'
import {useSalesSocket} from '@/sockets/sockets'
import React, { useCallback, useState ,useEffect} from 'react'
import { useNavigate } from 'react-router-dom'


const orderColumns = (onView) => [
  {
    accessorKey: "requestId",
    header: "Request ID",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.requestId}</span>
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


export function aggregateCanceledIngredients(items = []) {
  const map = new Map();

  for (const item of items) {
    if (!Array.isArray(item.cancelIngredientDetails)) continue;

    for (const ing of item.cancelIngredientDetails) {
      const key = String(ing.ingredientMasterId);

      if (!map.has(key)) {
        map.set(key, {
          ingredientMasterId: ing.ingredientMasterId,
          ingredientMasterName: ing.ingredientMasterName,
          requiredQty: ing.requiredQty,
          availableStock: ing.availableStock,
        });
      } else {
        const existing = map.get(key);

        existing.requiredQty += ing.requiredQty;

        // ⚠️ available stock should be the minimum seen
        existing.availableStock = Math.min(
          existing.availableStock,
          ing.availableStock
        );
      }
    }
  }

  return Array.from(map.values());
}





export const Orders = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user"))
  const tenantId = user.tenant.tenantId
  const outletId = user.outlet.outletId

  const { data, isLoading, refetch } = useGetSaleDetailsQuery()
  const [orders, setOrders] = useState([])

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const[isCanceled,setISCancled] = useState(false)

  useEffect(() => {
    if (data?.data) {
      setOrders(data.data)
    }
  }, [data])

  const handleSocketCreate = useCallback((newDoc) => {
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

      const cancelIngredient= aggregateCanceledIngredients(order.items)
      setISCancled(true);
      setSelectedOrder(cancelIngredient)
      setIsModalOpen(true)
      return
    }
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

      <OrderDetailsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        isLoading={isLoading}
        isCanceled={isCanceled}
      />
    </div>
  )
}
