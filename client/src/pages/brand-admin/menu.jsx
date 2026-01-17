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
import { CreateItemModal } from '@/components/Form/brand-admin-form/create-item-form'


export const outletManagerColumns = (onDelete, Navigate) => [
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
    id: "deleteActions",
    header: "Delete",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(row.original)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "viewActions",
    header: "View Recipe",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="text-black hover:bg-black/10"
        onClick={(e) => {
          e.stopPropagation()
          Navigate(`/item/${row.original._id}`,{
            state: { itemName: row.original.itemName },
          })
        }}
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    ),
  },
]

const Item = () => {
  const [open, setOpen] = useState(false)
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
      `Are you sure you want to delete the item "${item.itemName}"?`
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
        headerTitle={`Items`}
        description="Manage, Create and Delete Menu Items For all Outlets"
        actionTooltip="Create New Item"
        onActionClick={() => setOpen(true)}
      />
      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {
          isLoading ?
            <div>Loading...</div> :
            <DataCard
              title={"MENU ITEMS"}
              searchable
              loading={isLoading || isDeleting}
              columns={outletManagerColumns(handleDeleteItem, Navigate)}
              data={data?.data ?? []}
              titleWhenEmpty={"No items found"}
              descriptionWhenEmpty={"We couldn’t find any items here. Try adding a new one or adjust your filters."}
            />
        }

      </div>
      
      <CreateItemModal
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}

export default Item