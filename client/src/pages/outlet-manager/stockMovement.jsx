import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { useGetSaleStockMovementDetailsQuery } from '@/redux/apis/outlet-manager/stockMovementApi'
import { useStockMovementSocket } from '@/sockets/sockets'
import React, { useCallback, useState ,useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardDateRangePicker from "@/components/data-range-picker";



const ingredientColumn = (navigate) => [
  {
    accessorKey: "ingredient.ingredientMasterName",
    header: "Ingredient",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.ingredient.ingredientMasterName}
      </span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span>
        {row.original.quantity}
      </span>
    ),
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {

      return (
        <span >
          {row.original.reason}
        </span>
      )
    },
  },
]


export const StockMovement = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user"))
  const tenantId = user.tenant.tenantId
  const outletId = user.outlet.outletId
  const [dateRange, setDateRange] = React.useState(null);
  

  const {
    data,
    isLoading,
    refetch,
  } = useGetSaleStockMovementDetailsQuery({
      fromDate: dateRange?.from,
      toDate: dateRange?.to,
    },{skip:!dateRange})

  const [stockMovements, setStockMovements] = useState([])
  
  
  useEffect(() => {
    if (data?.data) {
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
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataCard
            title="Stock Movement Entries"
            searchable
            loading={isLoading}
            columns={ingredientColumn(navigate)}
            data={stockMovements}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
            pagination={true}
          />
        )}
      </div>
    </div>
  )
}

