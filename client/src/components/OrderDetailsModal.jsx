import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DataTable } from "./data-card/table"

const orderColumns = [
    {
        accessorKey: "itemName",
        header: "Item",
        enableSorting: false,
    },
    {
        accessorKey: "qty",
        header: "Quantity",
        enableSorting: false,
        cell: ({ row }) => (
            <div className="text-right">{row.original.qty}</div>
        ),
    },
    {
        accessorKey: "totalAmount",
        header: "Order Amount",
        enableSorting: false,
        cell: ({ row }) => (
            <div className="text-right">
                ₹ {row.original.totalAmount.toLocaleString("en-IN")}
            </div>
        ),
    },
    {
        accessorKey: "makingCost",
        header: "Making Cost",
        enableSorting: false,
        cell: ({ row }) => (
            <div className="text-right">
                ₹ {row.original.makingCost.toLocaleString("en-IN")}
            </div>
        ),
    },
]
const cancelOrderColumns = [
    {
        accessorKey: "ingredientMasterName",
        header: "Item",
        enableSorting: false,
    },
    {
        accessorKey: "requiredQty",
        header: "Quantity",
        enableSorting: false,
        cell: ({ row }) => (
            <div className="text-right">{row.original.requiredQty}</div>
        ),
    },
    {
        accessorKey: "availableStock",
        header: "Available Stock ",
        enableSorting: false,
        cell: ({ row }) => (
            <div className="text-right">{row.original.availableStock}</div>
        ),
    },
]


const OrderDetailsModal = ({ open, onClose, order, isLoading ,isCanceled}) => {
    if (!order) return null
    console.log(isCanceled,order);
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-6">
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                </DialogHeader>

                <DialogDescription/>

                <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Request ID:</span>{" "}
                    {order.requestId}
                </div>

                <div className="mt-4 border rounded-md overflow-hidden">
                    <DataTable
                        data={order}
                        columns={isCanceled ? cancelOrderColumns : orderColumns}
                        isLoading={isLoading}
                        pagination={false}
                    />
                </div>

                <div className="mt-6 flex justify-end">
                    <Button variant="outline" onClick={onClose} >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

    )
}

export default OrderDetailsModal
