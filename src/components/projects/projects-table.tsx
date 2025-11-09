"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ProjectFormDialog } from "./project-form-dialog";

type Project = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  supervisorId: number | null;
  createdAt: string;
};

export function ProjectsTable() {
  const [items, setItems] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, _setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [_loading, setLoading] = useState(false);
  const [_editProject, _setEditProject] = useState<Project | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = status === "all" ? "" : status;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        q: q,
        status: statusParam,
      });
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();
      setItems(data.projects ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, status, dateFrom, dateTo]);

  // Reset to page 1 when filters change
  const prevFiltersRef = useRef({ q, status, dateFrom, dateTo });
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      prevFilters.q !== q ||
      prevFilters.status !== status ||
      prevFilters.dateFrom !== dateFrom ||
      prevFilters.dateTo !== dateTo;

    if (filtersChanged) {
      setPage(1);
      prevFiltersRef.current = { q, status, dateFrom, dateTo };
    }
  }, [q, status, dateFrom, dateTo]);

  useEffect(() => {
    load();
    if (typeof window !== "undefined") {
      const detail = { q, status, dateFrom, dateTo };
      window.dispatchEvent(new CustomEvent("projects:filters", { detail }));
    }
  }, [load, q, status, dateFrom, dateTo]);

  async function onDelete(id: number) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search projects..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1"
          />
          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <ProjectFormDialog
            onCompleted={() => load()}
            trigger={<Button className="ml-auto">New Project</Button>}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="dateFrom" className="text-sm whitespace-nowrap">
              From:
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dateTo" className="text-sm whitespace-nowrap">
              To:
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
              min={dateFrom || undefined}
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearDateFilters}
              className="h-9"
            >
              Clear Dates
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.code}</TableCell>
                <TableCell>{p.location}</TableCell>
                <TableCell>
                  {(p as { supervisorName?: string }).supervisorName ?? "—"}
                </TableCell>
                <TableCell>
                  {(() => {
                    const status = ((p as { status?: string }).status ??
                      "pending") as string;
                    const base =
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize";
                    const color =
                      status === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : status === "in-progress"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"; // pending/default
                    return <div className={`${base} ${color}`}>{status}</div>;
                  })()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <a href={`/projects/${p.id}`} title="View">
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      aria-label="View project"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </a>
                  <ProjectFormDialog
                    initial={p}
                    onCompleted={() => load()}
                    trigger={
                      <Button
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        aria-label="Edit project"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => onDelete(p.id)}
                    aria-label="Delete project"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {total > limit ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive href="#">
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const totalPages = Math.max(1, Math.ceil(total / limit));
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
