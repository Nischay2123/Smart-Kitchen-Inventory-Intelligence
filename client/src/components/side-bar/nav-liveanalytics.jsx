import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import React from "react"
import { useLocation } from "react-router-dom"

export const NavAnalytics= React.memo(function ({
  projects,
  title=""
}) {
  const location = useLocation()

  const isItemActive = React.useCallback(
    (url) => {
      if (!url) return false

      const normalizePath = (value) => {
        const normalized = String(value).replace(/\/+$/, "")
        return normalized || "/"
      }

      const currentPath = normalizePath(location.pathname)
      const itemPath = normalizePath(url)

      return (
        currentPath === itemPath ||
        (itemPath !== "/" && currentPath.startsWith(`${itemPath}/`))
      )
    },
    [location.pathname]
  )

  return (
    <SidebarGroup >
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
})


