import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { ExternalLink, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetAllItemsQuery,
  useDeleteItemsMutation,
} from "@/redux/apis/brand-admin/itemApi"


 const createRecipeColumn = (onDelete, Navigate) => [
  {
    accessorKey: "itemName",
    header: "Item Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.itemName}
      </span>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.price}
      </span>
    ),
  },
  {
    id: "viewActions",
    header: "Create/Update Recipes",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="text-black hover:bg-black/10"
        onClick={(e) => {
          e.stopPropagation()
          Navigate(`/recipe/${row.original._id}`,{
            state: { itemName: row.original.itemName },
          })
        }}
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    ),
  },
]

export const Recipe = () => {
  const Navigate = useNavigate()

  const {
    data,
    isLoading,
    isError,
  } = useGetAllItemsQuery()

  const [deleteItem, { isLoading: isDeleting }] =
    useDeleteItemsMutation()

  const handleDeleteItem = async (item) => {
    const result = window.confirm(
      `Are you sure you want to delete the Outlet Manager "${item.itemName}"?`
    )

    if (!result) return

    try {
      await deleteItem({ itemId: item._id }).unwrap()
    } catch (error) {
      console.error("Failed to delete outlet manager", error)
    }
  }
  return (
    <div className='w-full bg-gray-50 min-h-screen'>
      <SiteHeader
        headerTitle={`Recipes`}
        description="Create and Edit Recipes Items For all Outlets"
        isTooltip={false}
      />
      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {
          isLoading ?
            <div>Loading...</div> :
            <DataCard
              title={"Create and update Recipies for the items"}
              searchable
              loading={isLoading || isDeleting}
              columns={createRecipeColumn(handleDeleteItem, Navigate)}
              data={data?.data ?? []}
              titleWhenEmpty={"No items found to create recipes"}
              descriptionWhenEmpty={"We couldn’t find any items here. Try adding a new one or adjust your filters."}
            />
        }

      </div>
    </div>
  )
}

