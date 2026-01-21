import DataCard from '@/components/data-card/data-card'
import SiteHeader from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useGetAllIngredientsQuery,
  useDeleteIngredientMutation,
} from "@/redux/apis/brand-admin/ingredientApi"

import { CreateIngredientModal } from '@/components/Form/brand-admin-form/create-ingredient-form'


// ─────────────────────────────────────────────
// COLUMNS UPDATED FOR NEW SCHEMA
// ─────────────────────────────────────────────

const ingredientColumn = (onDelete) => [

  {
    accessorKey: "name",
    header: "Ingredient Name",

    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.name}
      </span>
    ),
  },

  // ───── MULTI UNITS ─────
  {
    id: "units",
    header: "Units",

    cell: ({ row }) => {

      const units = row.original.unit || []

      return (
        <div className="flex flex-wrap gap-1">

          {units.map(u => (
            <span
              key={u.unitId}
              className="
                text-xs bg-accent
                px-2 py-0.5 rounded
              "
            >
              {u.unitName}
            </span>
          ))}

        </div>
      )
    },
  },

  // ───── THRESHOLD INFO ─────
  {
    id: "threshold",
    header: "Threshold",

    cell: ({ row }) => {

      const t = row.original.threshold

      if (!t) return "-"

      return (
        <div className="text-xs space-y-1">

          <div>
            Low: {t.lowInBase}{" "}
            <span className="text-muted-foreground">
              (base)
            </span>
          </div>

          <div>
            Critical: {t.criticalInBase}{" "}
            <span className="text-muted-foreground">
              (base)
            </span>
          </div>

          <div className="text-muted-foreground">
            unit: {t.unit?.unitName}
          </div>

        </div>
      )
    },
  },

  // ───── DELETE ─────
  {
    id: "deleteActions",
    header: "Delete",

    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="
          text-destructive
          hover:bg-destructive/10
        "

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


// ─────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────

export const Ingredients = () => {

  const [open, setOpen] = useState(false)

  const {
    data,
    isLoading,
    isError,
  } = useGetAllIngredientsQuery()

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

          <div>Loading...</div>

        ) : (

          <DataCard
            title="INGREDIENTS"

            searchable

            loading={isLoading || isDeleting}

            columns={ingredientColumn(handleDeleteItem)}

            data={data?.data ?? []}

            titleWhenEmpty="No ingredients found"

            descriptionWhenEmpty="
              We couldn’t find any ingredients here.
              Try adding a new one.
            "
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
