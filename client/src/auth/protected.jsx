import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/auth";

export const ProtectedRoute = ({ children, roles, permissions }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  if (
    permissions &&
    user.role === "OUTLET_MANAGER" &&
    !permissions.every((p) => user.outletManagerPermissions?.[p])
  ) {
    return <Navigate to="/403" replace />;
}
  return children;
};
