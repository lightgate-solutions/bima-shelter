"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Loader2, Bell, Check, ExternalLink } from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get("/api/notification");
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.post(
        "/api/notification/mark-read",
        { ids: [id] },
        { withCredentials: true },
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const ids = notifications.map((n) => n.id);

      await axios.post("/api/notification/mark-read", { ids });

      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.post("/api/notification/clear", { all: true });
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  };

  const clearNotification = async (id: string) => {
    try {
      await axios.post("/api/notification/clear", { ids: [id] });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error clearing notification:", err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on reference ID
    // For now, navigate to tasks page (can be enhanced to detect type)
    if (notification.reference_id) {
      router.push(`/tasks/employee?highlight=${notification.reference_id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-4">
        <BackButton />
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-3">
          <Bell className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <>
          <Button
            onClick={markAllAsRead}
            className="mb-4 px-3 py-2 bg-blue-500 text-white rounded"
          >
            Mark all as read
          </Button>
          <Button
            onClick={clearAllNotifications}
            className="bg-red-600 text-white px-4 py-2 rounded ml-[71%]"
          >
            Clear All
          </Button>
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-all relative ${n.is_read ? "opacity-70" : "border-primary"} hover:shadow-md cursor-pointer`}
              onClick={() => handleNotificationClick(n)}
            >
              <CardHeader className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{n.title}</CardTitle>
                  {n.reference_id && (
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={n.is_read ? "secondary" : "default"}>
                    {n.notification_type}
                  </Badge>
                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-10">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {dayjs(n.created_at).format("MMM D, YYYY h:mm A")}
                </p>
              </CardContent>

              <div className="absolute bottom-3 right-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(n.id);
                  }}
                  className="h-7 px-3 text-xs text-red-500 border-red-300 hover:bg-red-50"
                >
                  Clear
                </Button>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
