
import Login from "@/pages/login";
import { SuperAdminApp } from "@/apps/super-admin/super-admin-app.jsx";
import { BrandAdminApp } from "@/apps/brand-admin/brand-admin-app.jsx";
import { OutletAdminApp } from "@/apps/outlet-admin/outlet-admin-app.jsx";
import { useAuth } from "./auth/auth";
import { Route, Routes, Navigate } from "react-router-dom";
import ForgotPassword from "@/pages/ForgotPassword";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  switch (user.role) {
    case "SUPER_ADMIN":
      return <SuperAdminApp />;
    case "BRAND_ADMIN":
      return <BrandAdminApp />;
    case "OUTLET_MANAGER":
      return <OutletAdminApp />;
    default:
      return <Navigate to="/403" replace />;;
  }
}




