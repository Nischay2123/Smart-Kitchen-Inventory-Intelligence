import { Route, Routes } from "react-router-dom"
import { renderRoutes } from "@/utils/render-routes.jsx"
import { superAdminRoutes } from "@/routes/super-routes.jsx"
import PermissionDenied from "@/components/permission-denied"
import NotFound from "@/components/not-found"

export function SuperAdminApp() {
  return (
      <Routes>
        {renderRoutes(superAdminRoutes,["SUPER_ADMIN"])}
        <Route path="/403" element={<PermissionDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
  )
}
