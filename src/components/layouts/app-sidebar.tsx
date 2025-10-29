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
  Users,
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
import type { User } from "better-auth";
import { useEffect, useMemo, useState } from "react";
import { getSessionRole, getUser as getEmployee } from "@/actions/auth/dal";

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
    // Task/Performance is customized per role at runtime
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
        {
          title: "All Tasks",
          url: "/hr/admin/tasks",
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
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const emp = await getEmployee();
        if (active) setIsManager(!!emp?.isManager);
        const role = await getSessionRole();
        if (active) setIsAdmin(role === "admin");
      } catch {
        if (active) {
          setIsManager(null);
          setIsAdmin(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const navItems = useMemo(() => {
    const base = data.navMain.filter((i) => i.title !== "Task/Performance");
    // Hide Task/Performance entirely for admins
    if (isAdmin) return base;
    const taskItem = {
      title: "Task/Performance",
      url: "/tasks",
      icon: AlarmClockCheck,
      items: isManager
        ? [
            { title: "History", url: "/tasks/history" },
            { title: "Task Item", url: "/tasks" },
            { title: "Task Submission", url: "/tasks/manager" },
          ]
        : [{ title: "To-Do", url: "/tasks/employee" }],
    };
    return [...base, taskItem];
  }, [isManager, isAdmin]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.org} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
