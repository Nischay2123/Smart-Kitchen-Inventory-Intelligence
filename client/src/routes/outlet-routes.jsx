import Dashboard from "@/pages/outlet/Dashboard"
import Orders from "@/pages/outlet/Orders"

export const outletAdminRoutes = [
  {
    path: "/dashboard",
    element: <Dashboard />
  },
  {
    path: "/orders",
    element: <Orders />
  }
]
