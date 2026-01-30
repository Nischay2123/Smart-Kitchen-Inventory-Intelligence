import React from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import { AppSidebar } from "@/components/side-bar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { renderRoutes } from "@/utils/render-routes";

import {
  GlassWater,
  ListCheck,
  ListOrdered,
  TrendingUpDown,
  Warehouse,
} from "lucide-react";

import { useLogoutMutation } from "@/redux/apis/userApi";

import { useAuth } from "@/auth/auth";
import { outletAdminRoutes } from "@/routes/outlet-routes";
import PermissionDenied from "@/components/permission-denied";
import NotFound from "@/components/not-found";



export const OutletAdminApp = () => {
  const navigate = useNavigate();
  const [logoutUser] = useLogoutMutation();
  const { user, setUser } = useAuth();



const rawMenu = [
  { name: "Stocks", url: "/", icon: ListCheck,permission: "RESTOCK" },
  { name: "Restock", url: "/restock", icon: Warehouse, permission: "RESTOCK" },
  { name: "Orders", url: "/orders", icon: ListOrdered,permission: "ANALYTICS"  },
  { name: "StockMovement", url: "/saleStockMovement", icon: TrendingUpDown,permission: "ANALYTICS"  },
  { name: "Consumption", url: "/consumption", icon: GlassWater, permission: "ANALYTICS" },
];

const filteredMenu = rawMenu.filter(
  (item) =>
    !item.permission ||
    user?.outletManagerPermissions?.[item.permission]
);

const data = {
  brand: user?.outlet?.outletName || "",
  user: {
    name: user?.userName || "",
    email: user?.email || "",
    avatar: "/avatars/shadcn.jpg",
  },
  liveAnalytics: filteredMenu,
};

const data = {
  brand: user?.outlet?.outletName || "",
  user: {
    name: user?.userName || "",
    email: user?.email || "",
    avatar: "/avatars/shadcn.jpg",
  },
  liveAnalytics: filteredMenu,
};


  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } finally {
      setUser(null);      
    }
  };


  return (
    <SidebarProvider>
        <AppSidebar handleLogout={handleLogout} data={data} />
      <Routes>
        {renderRoutes(outletAdminRoutes,["OUTLET_MANAGER"])}
        <Route path="/403" element={<PermissionDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
    </SidebarProvider>
  );
};
