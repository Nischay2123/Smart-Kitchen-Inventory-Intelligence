import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetAllItemsQuery,
  useDeleteItemsMutation,
} from "@/redux/apis/brand-admin/itemApi"
import { CreateItemModal } from '@/components/Form/brand-admin-form/create-item-form'
import { menuColumns } from '@/utils/columns/brand-admin'
import { SkeletonLoader } from '@/components/laoder'


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
            <SkeletonLoader/> :
            <DataCard
              title={"MENU ITEMS"}
              searchable
              loading={isLoading || isDeleting}
              columns={menuColumns(handleDeleteItem, Navigate)}
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