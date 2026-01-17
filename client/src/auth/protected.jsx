import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/auth";

export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <div>Unauthorized</div>;
  }

  return children;
};
