import { Brand } from "@/pages/super-admin/brand"
import SuperAdmin from "@/pages/super-admin/super-admin"


export const superAdminRoutes = [
  {
    path: "/",
    element: <SuperAdmin />
  },
  {
    path: "/brand/:id",
    element: <Brand />
  }
]
