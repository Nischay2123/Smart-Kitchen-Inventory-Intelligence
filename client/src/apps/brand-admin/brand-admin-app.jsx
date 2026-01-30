import React from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import { AppSidebar } from "@/components/side-bar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { brandAdminRoutes } from "@/routes/brand-routes.jsx";
import { renderRoutes } from "@/utils/render-routes";

import {
  Building2Icon,
  CookingPot,
  Menu,
  MenuIcon,
  Ruler,
  Utensils,
} from "lucide-react";

import { useLogoutMutation } from "@/redux/apis/userApi";

import { useAuth } from "@/auth/auth";
import PermissionDenied from "@/components/permission-denied";
import NotFound from "@/components/not-found";



export const BrandAdminApp = () => {
  const navigate = useNavigate();
  const [logoutUser] = useLogoutMutation();
  const { user, setUser } = useAuth();



  const data = {
    brand: user?.tenant?.tenantName?.toUpperCase() || "",
    user: {
      name: user?.userName || "",
      email: user?.email || "",
      avatar: "/avatars/shadcn.jpg",
    },
    liveAnalytics: [
      {
        name: "Outlets",
        url: "/",
        icon: Building2Icon,
      },
      {
        name: "Menu Items",
        url: "/items",
        icon: MenuIcon,
      },
      {
        name: "Recipes",
        url: "/recipes",
        icon: CookingPot,
      },
      {
        name: "Ingredients",
        url: "/ingredients",
        icon: Utensils,
      },
      {
        name: "Units",
        url: "/units",
        icon: Ruler,
      },
    ],
    analytics: [
      {
        name: "Overview",
        url: "/overview",
        icon: Building2Icon,
      },
      {
        name: "Menu Analysis",
        url: "/menu-item",
        icon: Menu,
      },
    ],
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
      <Routes>{
        renderRoutes(brandAdminRoutes,["BRAND_ADMIN"])}
        <Route path="/403" element={<PermissionDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SidebarProvider>
  );
};
