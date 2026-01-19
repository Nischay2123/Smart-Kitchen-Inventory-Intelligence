import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { useGetStockMovementDetailsQuery } from '@/redux/apis/outlet-manager/stockMovementApi'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'


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
    accessorKey: "purchasePriceInUnit",
    header: "Price",
    cell:({row})=>(
      <span>
        {row.original.purchasePriceInUnit ? row.original.purchasePriceInUnit : "--"}
      </span>
    )
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


export const Restocks = () => {
  const navigate = useNavigate()
  const [open , setOpen]= useState(false);

  const {
    data,
    isLoading,
    isError,
  } = useGetStockMovementDetailsQuery()

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
            columns={ingredientColumn(navigate)}
            data={data?.data ?? []}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="We couldn’t find any ingredients here."
          />
        )}
      </div>
    </div>
  )
}

