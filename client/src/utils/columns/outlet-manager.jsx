import { Button } from "@/components/ui/button";

export const ingredientColumn = (setOpen, setSelectedIngredient) => [
  {
    accessorKey: "ingredientName",
    header: "Ingredient",
  },

  {
    accessorKey: "currentStockInBase",
    header: "Current Stock",
  },

  {
    accessorKey: "baseUnit",
    header: "Unit",
  },
  
  {
    accessorKey: "alertState",
    header: "Status",
    cell: ({ row }) => {
      const state = row.original.alertState;

      const statusColor = {
        OK: "text-green-700",
        LOW: "text-yellow-700",
        CRITICAL: "text-red-700",
        NOT_INITIALIZED: "text-gray-600",
      };

      const statusBg = {
        OK: "bg-green-200",
        LOW: "bg-yellow-200",
        CRITICAL: "bg-red-200",
        NOT_INITIALIZED: "bg-gray-200",
      };

      return (
        <span
          className={`font-medium px-2 py-1 rounded ${statusColor[state]} ${statusBg[state]}`}
        >
          {state}
        </span>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();

          setSelectedIngredient({
            ingredientMasterId: row.original.ingredientId,
            ingredientName: row.original.ingredientName,
            unit: row.original.unit,
          });

          setOpen(true);
        }}
      >
        Restock
      </Button>
    ),
  },
];


export const stockMovementColumn = (navigate) => [
    {
      accessorKey: "orderId",
      header: "Order Id",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.orderId}
        </span>
      ),
    },
    {
      accessorKey: "ingredient.ingredientMasterName",
      header: "Ingredient",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.ingredient.ingredientMasterName}
        </span>
      ),
    },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span>
        {row.original.quantity}
      </span>
    ),
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {

      return (
        <span >
          {row.original.reason}
        </span>
      )
    },
  },
]


export const restockColumn = (navigate) => [
  {
    accessorKey: "ingredient.ingredientMasterName",
    header: "Ingredient",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.ingredient.ingredientMasterName}
      </span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span>
        {row.original.quantity}
      </span>
    ),
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "purchasePriceInUnit",
    header: "Price",
    cell:({row})=>(
      <span>
        {row.original.purchasePriceInUnit ? row.original.purchasePriceInUnit : "--"}
      </span>
    )
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {

      return (
        <span >
          {row.original.reason}
        </span>
      )
    },
  },
]


export const orderColumns = (onView) => [
    {
  id: "srNo",
  header: "Sr. No.",
  cell: ({ row, table }) => {
    const pageIndex = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;

    return (
      <span>
        {pageIndex * pageSize + row.index + 1}
      </span>
    );
  },
},

  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => (
      <span className="font-medium">{`${new Date(row.original.createdAt).toLocaleDateString()} - ${new Date(row.original.createdAt).toLocaleTimeString()}`}</span>
    ),
  },

  {
    header: "Order Price",
    cell: ({ row }) => {
      const total = row.original.items.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      )
      return <span>₹ {total.toFixed(2)}</span>
    },
  },

  {
    header: "Making Cost",
    cell: ({ row }) => {
      const cost = row.original.items.reduce(
        (sum, item) => sum + item.makingCost,
        0
      )
      return <span>₹ {cost.toFixed(2)}</span>
    },
  },

  {
    accessorKey: "state",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.state
      const statusColor = {
        CANCELED: "bg-red-100 text-red-500",
        CONFIRMED: "bg-green-100 text-green-700",
      }

      return (
        <span className={`px-2 py-1 rounded text-xs ${statusColor[status]}`}>
          {status}
        </span>
      )
    },
  },

  {
    header: "Action",
    cell: ({ row }) => (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onView(row.original)}
      >
        View
      </Button>
    ),
  },
]





