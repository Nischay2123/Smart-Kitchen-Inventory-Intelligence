import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import {ingredientColumn} from "../../utils/columns/brand-admin"

import {
  useGetAllIngredientsQuery,
  useDeleteIngredientMutation,
} from "@/redux/apis/brand-admin/ingredientApi"

import { CreateIngredientModal } from '@/components/Form/brand-admin-form/create-ingredient-form'
import { SkeletonLoader } from '@/components/laoder'


export const Ingredients = () => {

  const [open, setOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })


  const {
    data,
    isLoading,
    isError,
  } = useGetAllIngredientsQuery({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize
  })

  const [deleteIngredient, { isLoading: isDeleting }] =
    useDeleteIngredientMutation()

  const handleDeleteItem = async (ingredient) => {

    const result = window.confirm(
      `Are you sure you want to delete ingredient "${ingredient.name}"?`
    )

    if (!result) return

    try {
      await deleteIngredient({
        ingredientId: ingredient._id,
      }).unwrap()

    } catch (error) {
      console.error("Failed to delete ingredient", error)
    }
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">

      <SiteHeader
        headerTitle="Ingredients"
        description="Manage ingredients for items"
        actionTooltip="Create New Ingredient"
        onActionClick={() => setOpen(true)}
      />

      <div className="flex-1 min-h-0 p-4 lg:p-6">

        {isLoading ? (
          <SkeletonLoader/>
        ) : (
          <DataCard
            title="INGREDIENTS"
            searchable
            loading={isLoading || isDeleting}
            columns={ingredientColumn(handleDeleteItem)}
            data={data?.data.ingredients ?? []}
            titleWhenEmpty="No ingredients found"
            descriptionWhenEmpty="
              We couldn’t find any ingredients here.
              Try adding a new one.
            "
            manualPagination={true}
            pageCount={data?.data?.pagination?.totalPages || 0}
            onPaginationChange={setPagination}
            paginationState={pagination}
          />
        )}
      </div>

      <CreateIngredientModal
        open={open}
        onOpenChange={setOpen}
      />

    </div>
  )
}
