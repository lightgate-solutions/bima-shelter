"use client";

import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

import Link from "next/link";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const getNotificationsCount = async () => {
      try {
        const res = await axios.get("/api/notification/unread-count", {
          timeout: 5000, // 5 second timeout
        });
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        // Only log if it's not a network error (which might be temporary)
        if (axios.isAxiosError(err)) {
          // Network errors are common during server restarts, don't spam console
          if (err.code !== "ERR_NETWORK" && err.code !== "ECONNABORTED") {
            console.error("Failed to fetch unread count", err);
          }
        } else {
          console.error("Failed to fetch unread count", err);
        }
        // Keep current count on error, don't reset to 0
      }
    };

    getNotificationsCount();

    //auto-refresh every 30s
    const interval = setInterval(getNotificationsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/notification">
      <div className="relative cursor-pointer hover:text-primary transition-colors">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
        )}
      </div>
    </Link>
  );
}
