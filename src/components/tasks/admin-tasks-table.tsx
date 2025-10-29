"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import type { Task } from "@/types";

// UI Task extended with names
type UITask = Task & {
  assignedToEmail?: string | null;
  assignedByEmail?: string | null;
  assignedToName?: string | null;
  assignedByName?: string | null;
  assignees?: { id: number; email: string | null; name: string | null }[];
};

type Option = { id: number; name: string | null; email: string | null };

export function AdminTasksTable() {
  const [items, setItems] = useState<UITask[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [managers, setManagers] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [managerId, setManagerId] = useState<string>("all");
  const [employeeId, setEmployeeId] = useState<string>("all");

  // Fetch filter options
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [mgrRes, empRes] = await Promise.all([
          fetch("/api/hr/employees/supervisors"),
          fetch("/api/hr/employees/all?limit=200"),
        ]);
        const mgrData = await mgrRes.json();
        const empData = await empRes.json();
        if (!active) return;
        setManagers(mgrData.supervisors || []);
        setEmployees(empData.employees || []);
      } catch (e) {
        console.error("Failed to load filter options", e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const buildUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (managerId && managerId !== "all") params.set("managerId", managerId);
    if (employeeId && employeeId !== "all")
      params.set("employeeId", employeeId);
    return `/api/hr/admin/tasks?${params.toString()}`;
  }, [page, limit, q, status, managerId, employeeId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl);
      const data = await res.json();
      setItems(data.tasks || []);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const total = items.length; // backend doesn't send total; use current length

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            placeholder="Search tasks..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={managerId}
            onValueChange={(v) => {
              setManagerId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name ?? m.email ?? `#${m.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={employeeId}
            onValueChange={(v) => {
              setEmployeeId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.name ?? e.email ?? `#${e.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            className="text-sm px-3 py-2 rounded-md border bg-background hover:bg-accent"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh"
            title="Refresh"
            type="button"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Assigned By</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.title}</TableCell>
              <TableCell>
                {t.assignedByName ?? t.assignedByEmail ?? `#${t.assignedBy}`}
              </TableCell>
              <TableCell>
                {Array.isArray(t.assignees) && t.assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {t.assignees.map((a) => (
                      <span
                        key={a.id}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs"
                      >
                        {a.name ?? a.email ?? `#${a.id}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  t.assignedToName ||
                  t.assignedToEmail ||
                  (t.assignedTo ? `#${t.assignedTo}` : "-")
                )}
              </TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell>{t.priority ?? "N/A"}</TableCell>
              <TableCell>{t.dueDate ?? "N/A"}</TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No tasks found
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <Separator className="my-4" />
      {total > limit ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(Math.max(1, page - 1))}
              />
            </PaginationItem>
            {[...Array(Math.ceil(total / limit)).keys()].map((num) => (
              <PaginationItem key={num + 1}>
                <PaginationLink onClick={() => setPage(num + 1)}>
                  {num + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setPage(Math.min(Math.ceil(total / limit), page + 1))
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
