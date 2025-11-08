"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Receipt, Banknote } from "lucide-react";

export function ProjectsCards() {
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
      // Always filter by in-progress status for cards (ongoing projects only)
      const status = "in-progress";
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("status", status);
      const res = await fetch(`/api/projects/stats?${params.toString()}`, {
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
  }, [filters.q]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Total Projects</CardTitle>
          <Folder className="text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats?.total ?? 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ongoing projects only
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget</CardTitle>
          <Banknote className="text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            ₦{(stats?.actual ?? 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ongoing projects only
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expenses</CardTitle>
          <Receipt className="text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            ₦{(stats?.expenses ?? 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ongoing projects only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
