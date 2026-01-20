import React from "react";
import { Routes, useNavigate } from "react-router-dom";

import { AppSidebar } from "@/components/side-bar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { renderRoutes } from "@/utils/render-routes";

import {
  ListCheck,
  ListOrdered,
  Warehouse,
} from "lucide-react";

import { useLogoutMutation } from "@/redux/apis/userApi";

import { useAuth } from "@/auth/auth";
import { outletAdminRoutes } from "@/routes/outlet-routes";



export const OutletAdminApp = () => {
  const navigate = useNavigate();
  const [logoutUser] = useLogoutMutation();
  const { user, setUser } = useAuth();



  const data = {
    brand: user?.outlet?.outletName || "",
    user: {
      name: user?.userName || "",
      email: user?.email || "",
      avatar: "/avatars/shadcn.jpg",
    },
    liveAnalytics: [
      {
        name: "Stocks",
        url: "/",
        icon: ListCheck,
      },
      {
        name: "Restock",
        url: "/restock",
        icon: Warehouse,
      },
      {
        name: "Orders",
        url: "/orders",
        icon: ListOrdered,
      },
      {
        name: "StockMovement",
        url: "/saleStockMovement",
        icon: ListOrdered,
      },
    ],
  };

  const handleLogout = async () => {
  try {
    localStorage.removeItem("user")
    await logoutUser().unwrap();
  } finally {
    setUser(null);      
    navigate("/", { replace: true });
  }
};


  return (
    <SidebarProvider>
        <AppSidebar handleLogout={handleLogout} data={data} />
      <Routes>{renderRoutes(outletAdminRoutes,["OUTLET_MANAGER"])}</Routes>
    </SidebarProvider>
  );
};
