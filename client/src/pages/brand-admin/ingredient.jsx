import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import CsvScanner from '@/components/common/CsvScanner'
import React, { useState } from 'react'
import { ingredientColumn } from "../../utils/columns/brand-admin"

import {
  useGetAllIngredientsQuery,
  useDeleteIngredientMutation,
} from "@/redux/apis/brand-admin/ingredientApi"

import { CreateIngredientModal } from '@/components/Form/brand-admin-form/create-ingredient-form'
import { SkeletonLoader, TableOverlayLoader } from '@/components/laoder'
import { debounce } from 'lodash'


export const Ingredients = () => {

  const [open, setOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState("");



  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetAllIngredientsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search
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
  const debouncedSearch = React.useMemo(
    () =>
      debounce((value) => {
        setPagination((prev) => ({
          ...prev,
          pageIndex: 0,
        }));

        setSearch(value);
      }, 400),
    []
  );

  React.useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);
  return (
    <div className="w-full bg-gray-50 min-h-screen">

      <SiteHeader
        headerTitle="Ingredients"
        description="Manage ingredients for items"
        actionTooltip="Create New Ingredient"
        onActionClick={() => setOpen(true)}
      >
        <CsvScanner type="ingredient" onSuccess={refetch} />
      </SiteHeader>

      <div className="flex-1 min-h-0 p-4 lg:p-6">

        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <div className="relative">
            {(isFetching && !isLoading) && <TableOverlayLoader />}
            <DataCard
              title="INGREDIENTS"
              searchable
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
              onGlobalFilterChange={debouncedSearch}
            />
          </div>
        )}
      </div>

      <CreateIngredientModal
        open={open}
        onOpenChange={setOpen}
      />

    </div>
  )
}
