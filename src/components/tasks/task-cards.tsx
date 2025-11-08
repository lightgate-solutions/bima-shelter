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
    let loading = false;
    let debounceTimer: number | null = null;

    async function load() {
      // Prevent concurrent or rapid-fire requests
      if (loading) return;
      loading = true;
      try {
        const res = await fetch(`/api/tasks/stats`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (mounted) setStats(data);
      } finally {
        loading = false;
      }
    }

    // Debounced load to prevent rapid-fire calls
    const debouncedLoad = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(load, 300);
    };

    load(); // Initial load

    // Listen only for explicit task refresh events (e.g., table refresh button or CRUD actions)
    window.addEventListener("tasks:changed", debouncedLoad);

    return () => {
      mounted = false;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      window.removeEventListener("tasks:changed", debouncedLoad);
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
