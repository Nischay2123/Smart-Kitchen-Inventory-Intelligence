import {Stocks} from "@/pages/outlet-manager/stocks"
import {Orders} from "@/pages/outlet-manager/orders"
import {Restocks} from "@/pages/outlet-manager/Restocks"
import {StockMovement} from "@/pages/outlet-manager/StockMovement"
import { Consumption } from "@/pages/outlet-manager/consumption"

export const outletAdminRoutes = [
  {
    path: "/",
    element: <Stocks />,
    permissions: ["RESTOCK"]
  },
  {
    path: "/restock",
    element: <Restocks />,
    permissions: ["RESTOCK"]
  },
  {
    path: "/orders",
    element: <Orders />,
    permissions: ["ANALYTICS"],
  },
  {
    path: "/saleStockMovement",
    element: <StockMovement />,
    permissions: ["ANALYTICS"],
  },
  {
    path: "/consumption",
    element: <Consumption />,
    permissions: ["ANALYTICS"],
  }
]
