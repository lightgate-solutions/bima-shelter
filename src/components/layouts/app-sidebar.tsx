"use client";

import type * as React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
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
  Users,
  Warehouse,
  Bell,
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
import type { User } from "better-auth";

const data = {
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
          title: "Main",
          url: "/documents",
        },
        {
          title: "Search",
          url: "/documents/search",
        },
        {
          title: "All Documents",
          url: "/documents/all",
        },
        {
          title: "Archive",
          url: "/documents/archive",
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
        {
          title: "Sent",
          url: "/mail/sent",
        },
        {
          title: "Archive",
          url: "/mail/archive",
        },
        {
          title: "Trash",
          url: "/mail/trash",
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
          url: "/projects",
        },
      ],
    },
    {
      title: "Hr/Payroll",
      url: "/hr",
      icon: Users,
      items: [
        {
          title: "User Management",
          url: "/hr/admin",
        },
        {
          title: "View Employees",
          url: "/hr/employees",
        },
      ],
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      items: [
        {
          title: "View Notifications",
          url: "/notification",
        },
        {
          title: "Notifications Preferences",
          url: "/notification-preferences",
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

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const getNotificationsCount = async () => {
      const res = await axios.get("/api/notification/unread-count");
      // console.log(res, "response")
      setUnreadCount(res.data.count);
    };

    getNotificationsCount();
  }, []);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.org} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} unreadCount={unreadCount} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
