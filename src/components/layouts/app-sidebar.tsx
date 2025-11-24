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
  Newspaper,
  Bug,
  Logs,
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
      name: "Bima Shelter",
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
        {
          title: "Loan Disbursement",
          url: "/finance/loans",
        },
        {
          title: "Payrun",
          url: "/finance/payruns",
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
          title: "Ask HR",
          url: "/hr/ask-hr",
        },
        {
          title: "Loan Management",
          url: "/hr/loans",
        },
        {
          title: "Leave Management",
          url: "/hr/leaves",
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
        {
          title: "Payrun",
          url: "/payroll/payrun",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [isHrOrAdmin, setIsHrOrAdmin] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const getNotificationsCount = async () => {
      const res = await axios.get("/api/notification/unread-count");
      // console.log(res, "response")
      setUnreadCount(res.data.count);
    };

    getNotificationsCount();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const emp = await getEmployee();
        if (active) {
          setIsManager(!!emp?.isManager);
          setIsAdmin(emp?.role === "admin");

          if (emp?.department === "hr" || emp?.role === "admin") {
            setIsHrOrAdmin(true);
          } else {
            setIsHrOrAdmin(false);
          }
        }
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
            { title: "Task Item", url: "/tasks" },
            { title: "To-Do", url: "/tasks/employee" },
            { title: "Task Submission", url: "/tasks/manager" },
            { title: "History", url: "/tasks/history" },
          ]
        : [],
    };
    const newsItem = {
      title: "News",
      url: "/news",
      icon: Newspaper,
      items: isHrOrAdmin
        ? [
            { title: "View News", url: "/news" },
            { title: "Manage News", url: "/news/manage" },
          ]
        : [{ title: "View News", url: "/news" }],
    };

    const items = [...base, taskItem, newsItem];

    // Only show Data Export to admins
    if (isAdmin) {
      items.push({
        title: "Data Export",
        url: "/logs",
        icon: Logs,
        isActive: false,
      });
    }

    items.push({
      title: "Support/Feedback",
      url: "/bug",
      icon: Bug,
      isActive: false,
    });

    return items;
  }, [isManager, isHrOrAdmin, isAdmin]);

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
