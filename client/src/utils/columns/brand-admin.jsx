import TickModal from "@/components/permission"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trash2, Key, Ban } from 'lucide-react'
import { useState } from "react"

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
  {
    id: "permission",
    header: "Update Permission",
    cell: ({ row }) => {
      const [open, setOpen] = useState(false)

      return (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="text-black hover:bg-black/10"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(true)
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          <TickModal
            open={open}
            setOpen={setOpen}
            initialPermissions={row.original.outletManagerPermissions}
            outletManagerId={row.original._id}
          />
        </>
      )
    },
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
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-black hover:bg-black/10"
          onClick={(e) => {
            e.stopPropagation()
            Navigate(`/item/${row.original._id}`, {
              state: { itemName: row.original.itemName },
            })
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

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
      </div>
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
            unit: {t.unit?.baseUnit}
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


export  const createRecipeColumn = ( Navigate) => [
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

export const apiKeyColumns = (onRevoke) => [
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.description || "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "outlet.outletName",
    header: "Outlet",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.outlet?.outletName || "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge 
        variant={row.original.isActive ? "default" : "destructive"}
        className={row.original.isActive ? "bg-green-500 hover:bg-green-600" : ""}
      >
        {row.original.isActive ? "Active" : "Revoked"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date= row.original.createdAt ;
       return <span className="text-muted-foreground text-sm">
          {date ? new Date(date).toLocaleDateString() : "Never"}
        </span>
    }
  },
  {
    accessorKey: "createdBy.userEmail",
    header: "Created By",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.createdBy.userEmail }
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
        disabled={!row.original.isActive}
        onClick={(e) => {
          e.stopPropagation()
          onRevoke(row.original)
        }}
      >
        <Ban className="h-4 w-4" />
      </Button>
    ),
  },
]
