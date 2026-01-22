import { Button } from "@/components/ui/button"
import { ExternalLink, Trash2 } from 'lucide-react'

export const outletManagerColumns = (onDelete) => [
  {
    accessorKey: "userName",
    header: "Outlet Manager Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.userName}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.email}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
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



export const menuColumns = (onDelete, Navigate) => [
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




export const recipeColumn = () => [
    {
        accessorKey: "ingredientName",
        header: "Ingredient Name",
        cell: ({ row }) => (
            <span className="font-medium">
                {row.original.ingredientName}
            </span>
        ),
    },
    {
        accessorKey: "quantity",
        header: "Ouantity",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.quantity}
            </span>
        ),
    },
    {
        accessorKey: "unitName",
        header: "Base Unit",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.unitName}
            </span>
        ),
    },
]



export const ingredientColumn = (onDelete) => [

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


export  const createRecipeColumn = (onDelete, Navigate) => [
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

export  const unitColumn = () => [
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "baseUnit",
    header: "Base Unit",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.baseUnit}
      </span>
    ),
  },
  {
    accessorKey: "conversionRate",
    header: "Converstion Rate",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.conversionRate}
      </span>
    ),
  },
]
