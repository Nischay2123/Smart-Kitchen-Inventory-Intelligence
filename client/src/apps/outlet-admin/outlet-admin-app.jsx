import React, { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
import { ConfirmModal } from '@/components/common/ConfirmModal'



export const OutletAdminApp = () => {
  const [logoutUser, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { user, setUser } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);



  const rawMenu = [
    { name: "Stocks", url: "/", icon: ListCheck, permission: "RESTOCK" },
    { name: "Restock", url: "/restock", icon: Warehouse, permission: "RESTOCK" },
    { name: "Order Details", url: "/orders", icon: ListOrdered, permission: "ANALYTICS" },
    { name: "StockMovement", url: "/saleStockMovement", icon: TrendingUpDown, permission: "ANALYTICS" },
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


  const handleLogout = () => {
    setIsLogoutOpen(true);
  };

  const confirmLogout = async () => {
    try {
      await logoutUser().unwrap();
      setUser(null);
      toast.success("Logged out successfully");
    } catch (e) {
      console.log("Failed to LogOut: ", e?.message);
      toast.error("Failed to LogOut");
    } finally {
      setIsLogoutOpen(false);
    }
  };
  // console.log(user);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }


  return (
    <SidebarProvider>
      <>
        <AppSidebar handleLogout={handleLogout} data={data} />
        <Routes>
          {renderRoutes(outletAdminRoutes, ["OUTLET_MANAGER"])}
          <Route path="/403" element={<PermissionDenied />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ConfirmModal
          isOpen={isLogoutOpen}
          onClose={() => setIsLogoutOpen(false)}
          onConfirm={confirmLogout}
          title="Log Out?"
          description="Are you sure you want to log out of your session?"
          confirmText="Log Out"
          loading={isLoggingOut}
        />
      </>
    </SidebarProvider>

  );
};


