"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TasksCard() {
  const [stats, setStats] = useState<{
    active: number;
    pending: number;
    inProgress: number;
  } | null>(null);
  // Reserved for future filtering needs
  // const [filters, setFilters] = useState<{ q?: string; status?: string }>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      // Currently no filters applied on stats API; reserved for future
      const res = await fetch(`/api/tasks/stats`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (mounted) setStats(data);
    }
    load();
    const handler = () => load();
    // Listen for task-specific events; keep legacy listeners no-op safe
    window.addEventListener("tasks:changed", handler);
    // Also poll periodically so other users' changes reflect across sessions
    const intervalId = window.setInterval(load, 8000); // 8s lightweight polling
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      window.removeEventListener("tasks:changed", handler);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Tasks</CardTitle>
          {/* <Folder className="text-primary" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats?.active ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Tasks</CardTitle>
          {/* <Banknote className="text-primary" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats?.pending ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>In Progress Tasks</CardTitle>
          {/* <Receipt className="text-primary" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats?.inProgress ?? 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}
