import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import CsvScanner from '@/components/common/CsvScanner'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { ingredientColumn } from "../../utils/columns/brand-admin"

import {
  useGetAllIngredientsQuery,
  useDeleteIngredientMutation,
} from "@/redux/apis/brand-admin/ingredientApi"

import { CreateIngredientModal } from '@/components/Form/brand-admin-form/create-ingredient-form'
import { SkeletonLoader, TableOverlayLoader } from '@/components/laoder'
import { debounce } from 'lodash'
import { ConfirmModal } from '@/components/common/ConfirmModal'


export const Ingredients = () => {

  const [open, setOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState("");
  const [ingredientToDelete, setIngredientToDelete] = useState(null);



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

  const handleDeleteItem = (ingredient) => {
    setIngredientToDelete(ingredient);
  };

  const confirmDelete = async () => {
    try {
      if (!ingredientToDelete) return;
      await deleteIngredient({
        ingredientId: ingredientToDelete._id,
      }).unwrap();
      toast.success("Ingredient deleted successfully");
    } catch (error) {
      console.error("Failed to delete ingredient", error);
      toast.error(error?.data?.message || "Failed to delete ingredient");
    } finally {
      setIngredientToDelete(null);
    }
  };
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

      <ConfirmModal
        isOpen={!!ingredientToDelete}
        onClose={() => setIngredientToDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete Ingredient "${ingredientToDelete?.name}"?`}
        description="This action cannot be undone. This ingredient will be permanently removed."
        confirmText="Delete"
        isDanger={true}
        loading={isDeleting}
      />

    </div>
  )
}
