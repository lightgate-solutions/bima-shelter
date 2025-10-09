"use client";

import type * as React from "react";
import {
  AlarmClockCheck,
  Folder,
  Frame,
  GalleryVerticalEnd,
  Landmark,
  Mail,
  Map as MapIcon,
  PieChart,
  TvMinimal,
  Warehouse,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TeamSwitcher } from "./team-switcher";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "Admin",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  org: [
    {
      name: "Bima Shelters",
      logo: GalleryVerticalEnd,
      plan: "Management System",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: TvMinimal,
      isActive: false,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: Folder,
      isActive: false,
      items: [
        {
          title: "History",
          url: "/documents/history",
        },
      ],
    },
    {
      title: "Finance",
      url: "/finance",
      icon: Landmark,
      items: [
        {
          title: "Payroll",
          url: "/finance/payroll",
        },
      ],
    },
    {
      title: "Task/Performance",
      url: "/tasks",
      icon: AlarmClockCheck,
      items: [
        {
          title: "To-Do",
          url: "/tasks/todo",
        },
      ],
    },
    {
      title: "Mail",
      url: "/mail",
      icon: Mail,
      items: [
        {
          title: "Inbox",
          url: "/mail/inbox",
        },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Warehouse,
      items: [
        {
          title: "View All",
          url: "/projects/all",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Asokoro Mall",
      url: "#",
      icon: Frame,
    },
    {
      name: "Efab - Maitama Extension",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Sokoto University",
      url: "#",
      icon: MapIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.org} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
