import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetAllItemsQuery,
  useDeleteItemsMutation,
} from "@/redux/apis/brand-admin/itemApi"
import { SkeletonLoader } from '@/components/laoder'
import { createRecipeColumn } from '@/utils/columns/brand-admin'




export const Recipe = () => {
  const Navigate = useNavigate()
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const {
    data,
    isLoading,
    isError,
  } = useGetAllItemsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize
  })

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
            <SkeletonLoader/>:
            <DataCard
              title={"Create and update Recipies for the items"}
              searchable
              loading={isLoading || isDeleting}
              columns={createRecipeColumn(handleDeleteItem, Navigate)}
              data={data?.data.menuItems ?? []}
              titleWhenEmpty={"No items found to create recipes"}
              descriptionWhenEmpty={"We couldn’t find any items here. Try adding a new one or adjust your filters."}
              manualPagination={true}
              pageCount={data?.data?.pagination?.totalPages || 0}
              onPaginationChange={setPagination}
              paginationState={pagination}
            />
        }

      </div>
    </div>
  )
}

