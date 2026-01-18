import {Stocks} from "@/pages/outlet-manager/stocks"
import Orders from "@/pages/outlet-manager/orders"
import {Restocks} from "@/pages/outlet-manager/Restocks"

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
  }
]
