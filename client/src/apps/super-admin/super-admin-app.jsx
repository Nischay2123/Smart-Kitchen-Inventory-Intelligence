import { Routes } from "react-router-dom"
import { renderRoutes } from "@/utils/render-routes.jsx"
import { superAdminRoutes } from "@/routes/super-routes.jsx"

export function SuperAdminApp() {
  return (
      <Routes>
        {renderRoutes(superAdminRoutes,["SUPER_ADMIN"])}
      </Routes>
  )
}
