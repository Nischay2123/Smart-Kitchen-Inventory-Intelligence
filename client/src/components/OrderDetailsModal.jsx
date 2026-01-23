import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DataTable } from "./data-card/table"
import { Badge } from "@/components/ui/badge"

const orderColumns = [
  {
    accessorKey: "itemName",
    header: "Item",
    enableSorting: false,
  },
  {
    accessorKey: "qty",
    header: "Qty",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.original.qty}
      </div>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        ₹ {row.original.totalAmount.toLocaleString("en-IN")}
      </div>
    ),
  },
  {
    accessorKey: "makingCost",
    header: "Cost",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        ₹ {row.original.makingCost.toLocaleString("en-IN")}
      </div>
    ),
  },
]

const OrderDetailsModal = ({ open, onClose, order, isLoading }) => {
  if (!order) return null

  const totalQty = order.reduce((sum, i) => sum + i.qty, 0)
  const totalAmount = order.reduce((sum, i) => sum + i.totalAmount, 0)
  const totalCost = order.reduce((sum, i) => sum + i.makingCost, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl">
            Order Details
          </DialogTitle>

          <DialogDescription className="text-sm">
            Detailed breakdown of ordered items
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <SummaryCard label="Total Qty" value={totalQty} />
          <SummaryCard
            label="Total Amount"
            value={`₹ ${totalAmount.toLocaleString("en-IN")}`}
          />
          <SummaryCard
            label="Making Cost"
            value={`₹ ${totalCost.toLocaleString("en-IN")}`}
            muted
          />
        </div>

        <div className="mt-5 border rounded-lg overflow-hidden">
          <DataTable
            data={order}
            columns={orderColumns}
            isLoading={isLoading}
            pagination={false}
          />
        </div>

        <div className="mt-6 flex justify-between items-center">
          <Badge variant="secondary">
            {order.length} Items
          </Badge>

          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const SummaryCard = ({ label, value, muted }) => {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold ${
          muted ? "text-muted-foreground" : ""
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default OrderDetailsModal
