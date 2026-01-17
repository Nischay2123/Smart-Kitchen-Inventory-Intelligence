import * as React from "react"


import { NavAnalytics } from "@/components/side-bar/nav-liveanalytics"
import { NavUser } from "@/components/side-bar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"



export const  AppSidebar=React.memo(({ data,handleLogout,...props })=> {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader  className="font-bold text-xl group-data-[state=collapsed]:hidden flex flex-row justify-between">
        {data.brand }
        <SidebarTrigger className="-ml-1" />
      </SidebarHeader>
      <div className="group-data-[state=expanded]:hidden hidden md:flex justify-center py-2">
        <SidebarTrigger />
      </div>
      <SidebarContent>
        <NavAnalytics projects={data.liveAnalytics} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser handleLogout={handleLogout} user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
})
