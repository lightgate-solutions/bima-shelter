"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Mail, CheckSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "sonner";

dayjs.extend(relativeTime);

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "email":
    case "message":
      return Mail;
    case "task":
    case "deadline":
    case "approval":
      return CheckSquare;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "email":
    case "message":
      return {
        bg: "bg-[#E0F2FE] dark:bg-blue-950/50",
        icon: "text-[#0284C7] dark:text-blue-400",
      };
    case "task":
    case "deadline":
    case "approval":
      return {
        bg: "bg-[#ECFDF5] dark:bg-emerald-950/50",
        icon: "text-[#10B981] dark:text-emerald-400",
      };
    default:
      return {
        bg: "bg-[#FEE2E2] dark:bg-red-950/50",
        icon: "text-[#DC2626] dark:text-red-400",
      };
  }
};

export default function RecentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const response = await fetch("/api/notification", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          // Don't log 401 errors as they're expected for unauthenticated users
          if (response.status !== 401) {
            const errorData = await response.json().catch(() => ({}));
            toast.error(
              "Error fetching notifications:",
              errorData.error || response.statusText,
            );
          }
          setNotifications([]);
          return;
        }

        const data = await response.json();
        // Get first 3 notifications, sorted by most recent (already sorted by getUserNotifications)
        type NotificationData = {
          id: number;
          title?: string;
          message?: string;
          notification_type?: string;
          is_read?: boolean;
          created_at?: string;
        };
        const recentNotifs = (data.data || [])
          .slice(0, 3)
          .map((n: NotificationData) => ({
            id: n.id,
            title: n.title || "",
            message: n.message || "",
            notification_type: n.notification_type || "message",
            is_read: n.is_read || false,
            created_at: n.created_at || new Date().toISOString(),
          }));
        setNotifications(recentNotifs);
      } catch (_error) {
        toast.error("Error fetching notifications:");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <Card className="border border-amber-100 dark:border-gray-800 bg-[#FDFCFB] dark:bg-gray-900/50 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-50 font-bold">
            Notifications
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 font-semibold">
            Latest system notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Static array for loading skeletons
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="border border-amber-100 dark:border-gray-800 bg-[#FDFCFB] dark:bg-gray-900/50 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-50 font-bold">
            Notifications
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 font-semibold">
            Latest system notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-[#FEE2E2] dark:bg-red-950/50 p-3 mb-2">
              <Bell className="h-8 w-8 text-[#DC2626] dark:text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              No notifications
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-amber-100 dark:border-gray-800 bg-[#FDFCFB] dark:bg-gray-900/50 shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-50 font-bold">
          Notifications
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 font-semibold">
          Latest system notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = getNotificationIcon(notif.notification_type);
            const iconColor = getNotificationColor(notif.notification_type);
            const timeAgo = dayjs(notif.created_at).fromNow();

            return (
              <Link
                key={notif.id}
                href="/notification"
                className={`block p-3 rounded-lg border transition-all backdrop-blur-sm ${
                  notif.is_read
                    ? "border-amber-100/50 dark:border-gray-800 bg-white/60 dark:bg-gray-800/30"
                    : "border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30"
                } hover:bg-white dark:hover:bg-gray-800/70`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2.5 shrink-0 ${iconColor.bg}`}>
                    <Icon className={`h-5 w-5 ${iconColor.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <Badge
                          variant="default"
                          className="shrink-0 text-xs bg-blue-600 dark:bg-blue-500 text-white"
                        >
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 line-clamp-2 mb-1">
                      {notif.message}
                    </p>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {timeAgo}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-amber-100/50 dark:border-gray-800">
          <Link
            href="/notification"
            className="text-sm font-bold text-[#DC2626] dark:text-red-400 hover:underline inline-flex items-center gap-1"
          >
            View all notifications
            <svg
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-label="Arrow right"
              role="img"
            >
              <title>Arrow right</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
