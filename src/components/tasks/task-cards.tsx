"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TasksCard() {
  const [stats, setStats] = useState<{
    total: number;
    actual: number;
    expenses: number;
  } | null>(null);
  const [filters, setFilters] = useState<{ q?: string; status?: string }>({});

  useEffect(() => {
    let mounted = true;
    async function load(next?: { q?: string; status?: string }) {
      const q = next?.q ?? filters.q ?? "";
      const status = next?.status ?? filters.status ?? "";
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await fetch(`/api/tasks/stats?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (mounted) setStats(data);
    }
    load();
    const handler = () => load();
    const filtersHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setFilters(detail);
      load(detail);
    };
    window.addEventListener("projects:changed", handler);
    window.addEventListener(
      "projects:filters",
      filtersHandler as EventListener,
    );
    return () => {
      mounted = false;
      window.removeEventListener("projects:changed", handler);
      window.removeEventListener(
        "projects:filters",
        filtersHandler as EventListener,
      );
    };
  }, [filters.q, filters.status]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Tasks</CardTitle>
          {/* <Folder className="text-primary" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats?.total ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Tasks</CardTitle>
          {/* <Banknote className="text-primary" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {(stats?.actual ?? 0).toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>In Progress Tasks</CardTitle>
          {/* <Receipt className="text-primary" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {(stats?.expenses ?? 0).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
