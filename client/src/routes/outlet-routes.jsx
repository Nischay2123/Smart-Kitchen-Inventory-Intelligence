import {Stocks} from "@/pages/outlet-manager/stocks"
import {Orders} from "@/pages/outlet-manager/orders"
import {Restocks} from "@/pages/outlet-manager/Restocks"
import {StockMovement} from "@/pages/outlet-manager/StockMovement"
import { Consumption } from "@/pages/outlet-manager/consumption"

export const outletAdminRoutes = [
  {
    path: "/",
    element: <Stocks />
  },
  {
    path: "/restock",
    element: <Restocks />
  },
  {
    path: "/orders",
    element: <Orders />
  },
  {
    path: "/saleStockMovement",
    element: <StockMovement />
  },
  {
    path: "/consumption",
    element: <Consumption />
  }
]
