import { Brand } from "@/pages/super-admin/brand"
import SuperAdmin from "@/pages/super-admin/super-admin"
import SchedulerMonitor from "@/pages/super-admin/scheduler-monitor"

export const superAdminRoutes = [
  {
    path: "/",
    element: <SuperAdmin />
  },
  {
    path: "/brand/:id",
    element: <Brand />
  },
  {
    path: "/scheduler-monitor",
    element: <SchedulerMonitor />
  }
]
