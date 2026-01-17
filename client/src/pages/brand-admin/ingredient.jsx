import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { ExternalLink, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetAllIngredientsQuery,
  useDeleteIngredientMutation,
} from "@/redux/apis/brand-admin/ingredientApi"
import { CreateIngredientModal } from '@/components/Form/brand-admin-form/create-ingredient-form'


const ingredientColumn  = (onDelete, Navigate) => [
  {
    accessorKey: "name",
    header: "Ingredient Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "unit.unitName",
    header: "Unit",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.unit.unitName}
      </span>
    ),
  },
  {
    id: "deleteActions",
    header: "Delete Action",
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
]

export const Ingredients = () => {
  const [open, setOpen] = useState(false)
  const Navigate = useNavigate()

  const {
    data,
    isLoading,
    isError,
  } = useGetAllIngredientsQuery()

  const [deleteIngredient, { isLoading: isDeleting }] =
    useDeleteIngredientMutation()

  const handleDeleteItem = async (ingredient) => {
    const result = window.confirm(
      `Are you sure you want to delete the Outlet Manager "${ingredient.name}"?`
    )

    if (!result) return

    try {
      await deleteIngredient({ ingredientId: ingredient._id }).unwrap()
    } catch (error) {
      console.error("Failed to delete outlet manager", error)
    }
  }
  return (
    <div className='w-full bg-gray-50 min-h-screen'>
      <SiteHeader
        headerTitle={`Ingredients`}
        description="Manage ingredients for items"
        actionTooltip="Create New Item"
        onActionClick={() => setOpen(true)}
      />
      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {
          isLoading ?
            <div>Loading...</div> :
            <DataCard
              title={"INGREDIENTS"}
              searchable
              loading={isLoading || isDeleting}
              columns={ingredientColumn(handleDeleteItem, Navigate)}
              data={data?.data ?? []}
              titleWhenEmpty={"No ingredients found"}
              descriptionWhenEmpty={"We couldn’t find any ingredients here. Try adding a new one or adjust your filters."}
            />
        }

      </div>
      
      <CreateIngredientModal
        open={open}
        onOpenChange={setOpen}
      />

      
    </div>
  )
}
