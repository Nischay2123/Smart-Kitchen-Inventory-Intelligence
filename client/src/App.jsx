
import Login from "@/pages/login";
import {SuperAdminApp} from "@/apps/super-admin/super-admin-app.jsx";
import {BrandAdminApp} from "@/apps/brand-admin/brand-admin-app.jsx";
import {OutletAdminApp} from "@/apps/outlet-admin/outlet-admin-app.jsx";
import { useAuth } from "./auth/auth";

export default function App() {
  const { user, loading } = useAuth();

if (loading) return null;

if (!user) return <Login />;

switch (user.role) {
  case "SUPER_ADMIN":
    return <SuperAdminApp />;
  case "BRAND_ADMIN":
    return <BrandAdminApp />;
  case "OUTLET_MANAGER":
    return <OutletAdminApp />;
  default:
    return <div>Unauthorized</div>;
}
}




