import { ProtectedRoute } from "@/auth/protected";
import { Route } from "react-router-dom"


export const renderRoutes = (routes, roles) =>
  routes.map(({ path, element,permissions }, idx) => (
    <Route
      key={idx}
      path={path}
      element={
        roles ? (
          <ProtectedRoute roles={roles} permissions={permissions}>
            {element}
          </ProtectedRoute>
        ) : element
      }
    />
  ));
