import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { useGetStockDetailsQuery } from '@/redux/apis/outlet-manager/stocksApi'
import { Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'


const ingredientColumn = (navigate) => [
  {
    accessorKey: "ingredientName",
    header: "Ingredient",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.ingredientName}
      </span>
    ),
  },
  {
    accessorKey: "currentStockInBase",
    header: "Current Stock",
    cell: ({ row }) => (
      <span>
        {row.original.currentStockInBase}
      </span>
    ),
  },
  {
    accessorKey: "baseUnit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.baseUnit}
      </span>
    ),
  },
  {
    accessorKey: "alertState",
    header: "Status",
    cell: ({ row }) => {
      const state = row.original.alertState

      const statusColor = {
        OK: "text-green-600",
        LOW: "text-yellow-600",
        CRITICAL: "text-red-600",
        NOT_INITIALIZED: "text-gray-500",
      }
      const statusBg = {
        OK: "bg-green-300",
        LOW: "bg-yellow-300",
        CRITICAL: "bg-red-300",
        NOT_INITIALIZED: "bg-gray-200",
      }

      return (
        <span className={`font-medium p-2 rounded-sm ${statusColor[state]} ${statusBg[state]}`}>
          {state}
        </span>
      )
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
          e.stopPropagation()
          navigate(`/restock`)
        }}
      >
        Restock
      </Button>
    ),
  },
]


export const Stocks = () => {
  const navigate = useNavigate()

  const {
    data,
    isLoading,
    isError,
  } = useGetStockDetailsQuery()

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <SiteHeader
        headerTitle="Stocks"
        description="available stock for the ingredients in outlet"
        isTooltip={false}
      />

      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataCard
            title="Avalaible Stock"
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

