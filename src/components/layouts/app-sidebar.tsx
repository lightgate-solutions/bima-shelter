"use client";

import type * as React from "react";
import axios from "axios";
import {
  AlarmClockCheck,
  Folder,
  GalleryVerticalEnd,
  Landmark,
  Mail,
  TvMinimal,
  Users,
  Warehouse,
  Bell,
  DollarSign,
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
import { NavUser } from "./nav-user";
import type { User } from "better-auth";
import { useEffect, useMemo, useState } from "react";
import { getUser as getEmployee } from "@/actions/auth/dal";

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
          title: "Company Expenses",
          url: "/finance/expenses",
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
      title: "Hr",
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
          title: "Leave Management",
          url: "/hr/leaves",
        },
        {
          title: "Apply for Leave",
          url: "/hr/leaves/apply",
        },
        {
          title: "Annual Leave Balances",
          url: "/hr/leaves/annual-balances",
        },
        {
          title: "All Tasks",
          url: "/hr/admin/tasks",
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
    {
      title: "Payroll",
      url: "/payroll",
      icon: DollarSign,
      items: [
        {
          title: "Salary Structures",
          url: "/payroll/structure",
        },
        {
          title: "Employees",
          url: "/payroll/employees",
        },
      ],
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
  const [isManager, setIsManager] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const emp = await getEmployee();
        if (active) setIsManager(!!emp?.isManager);
      } catch {
        if (active) {
          setIsManager(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const navItems = useMemo(() => {
    const base = data.navMain.filter((i) => i.title !== "Task/Performance");
    const taskItem = {
      title: "Task/Performance",
      url: "/tasks",
      icon: AlarmClockCheck,
      items: isManager
        ? [
            { title: "History", url: "/tasks/history" },
            { title: "Task Item", url: "/tasks" },
            { title: "Task Submission", url: "/tasks/manager" },
            { title: "To-Do", url: "/tasks/employee" },
          ]
        : [{ title: "To-Do", url: "/tasks/employee" }],
    };
    return [...base, taskItem];
  }, [isManager]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.org} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} unreadCount={unreadCount} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
