"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { TaskFormDialog } from "./task-form-dialog";
import { Eye, Pencil, Trash2, MessageSquare } from "lucide-react";
import { getUser } from "@/actions/auth/dal";
import type { User, Task } from "@/types";
import { Button } from "../ui/button";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import { UpdateTask } from "./update-task";
import { TaskView } from "./task-view";
import { TaskChatDialog } from "./task-chat-dialog";

type UITask = Task & {
  assignedToEmail?: string | null;
  assignedByEmail?: string | null;
  assignedToName?: string | null;
  assignedByName?: string | null;
  assignees?: { id: number; email: string | null; name: string | null }[];
};

export function TasksTable() {
  const [items, setItems] = useState<UITask[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, _setLimit] = useState<number>(10);
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [_loading, setLoading] = useState<boolean>(false);
  const [_editTask, _setEditTask] = useState<Task | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [user, setUser] = useState<User | null>(null);

  const getCurrentUser = useCallback(async () => {
    const employee = await getUser();
    setUser(employee);
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = status;
      const res = await fetch(
        `/api/tasks?page=${page}&limit=${limit}&q=${encodeURIComponent(
          q,
        )}&status=${encodeURIComponent(statusParam)}&role=${user?.isManager ? "manager" : "employee"}&employeeId=${user?.id}`,
      );
      const data = await res.json();
      setItems(data.tasks);
      setTotal(data?.tasks?.length || 0);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, status, user]);
  useEffect(() => {
    let mounted = true;
    if (mounted) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [load]);

  const openDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!deleteId || !user?.id) {
      setConfirmOpen(false);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${deleteId}?employeeId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((t) => t.id !== deleteId));
        setTotal((prev) => Math.max(0, prev - 1));
      } else {
        const body = await res.json().catch(() => ({}));
        console.error("Failed to delete task", body?.error);
      }
    } catch (e) {
      console.error("Error deleting task", e);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteId(null);
      // notify stats/cards to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks:changed"));
      }
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const RefreshButton = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRefresh}
      aria-label="Refresh tasks"
      title="Refresh"
      disabled={refreshing}
    >
      <svg
        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
    </Button>
  );
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <Input
          placeholder="Search tasks..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <Select value={status} onValueChange={(value) => setStatus(value)}>
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
          <RefreshButton />
          {user?.isManager ? (
            <Dialog>
              <DialogTrigger>
                <Button>New Task</Button>
              </DialogTrigger>
              <DialogContent>
                <TaskFormDialog
                  user={user}
                  onCompleted={() => {
                    load();
                    document.getElementById("close-create-task")?.click();
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("tasks:changed"));
                    }
                  }}
                  trigger={null}
                />
                <DialogClose asChild>
                  <button
                    type="button"
                    id="close-create-task"
                    className="hidden"
                  ></button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            {user?.isManager ? <TableHead>Assigned To</TableHead> : null}
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items
            ? items.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  {user?.isManager ? (
                    <TableCell>
                      {Array.isArray(task.assignees) &&
                      task.assignees.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.assignees.map((a) => (
                            <span
                              key={a.id}
                              className="rounded bg-muted px-1.5 py-0.5 text-xs"
                            >
                              {a.name ?? a.email ?? "Employee"} (#{a.id})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          No assignees
                        </span>
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell>{task.status}</TableCell>
                  <TableCell>{task.priority ?? "N/A"}</TableCell>
                  <TableCell>{task.dueDate ?? "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <TaskChatDialog
                        taskId={task.id}
                        user={user}
                        title={`Chat • ${task.title}`}
                        trigger={
                          <Button
                            variant={"ghost"}
                            size={"icon"}
                            aria-label="Open chat"
                            title="Chat"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Dialog>
                        <DialogTrigger>
                          <Button variant={"ghost"} size={"icon"}>
                            <Eye className="cursor-pointer" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <TaskView taskId={task.id} user={user} />
                        </DialogContent>
                      </Dialog>
                      {user?.isManager ? (
                        <>
                          <Dialog>
                            <DialogTrigger>
                              <Button variant={"ghost"}>
                                <Pencil className="cursor-pointer" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <UpdateTask
                                taskId={task.id}
                                user={user}
                                onUpdated={(updated) => {
                                  setItems((prev) =>
                                    prev.map((t) =>
                                      t.id === updated.id
                                        ? { ...t, ...updated }
                                        : t,
                                    ),
                                  );
                                  document
                                    .getElementById(`close-update-${task.id}`)
                                    ?.click();
                                  if (typeof window !== "undefined") {
                                    window.dispatchEvent(
                                      new Event("tasks:changed"),
                                    );
                                  }
                                }}
                              />
                              <DialogClose asChild>
                                <button
                                  type="button"
                                  id={`close-update-${task.id}`}
                                  className="hidden"
                                ></button>
                              </DialogClose>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant={"ghost"}
                            size={"icon"}
                            onClick={() => openDelete(task.id)}
                            aria-label="Delete task"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant={"ghost"}
                          disabled={
                            task.status === "In Progress" ||
                            task.status === "Completed" ||
                            task.status === "Overdue"
                          }
                          onClick={async () => {
                            if (!user?.id) return;
                            try {
                              const res = await fetch(
                                `/api/tasks/${task.id}?employeeId=${user.id}&role=employee`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    status: "In Progress",
                                  }),
                                },
                              );
                              if (res.ok) {
                                const body = await res.json().catch(() => ({}));
                                const updated = body?.task as Task | undefined;
                                if (updated) {
                                  setItems((prev) =>
                                    prev.map((t) =>
                                      t.id === updated.id
                                        ? { ...t, ...updated }
                                        : t,
                                    ),
                                  );
                                } else {
                                  // Fallback optimistic update
                                  setItems((prev) =>
                                    prev.map((t) =>
                                      t.id === task.id
                                        ? { ...t, status: "In Progress" }
                                        : t,
                                    ),
                                  );
                                }
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(
                                    new Event("tasks:changed"),
                                  );
                                }
                              }
                            } catch (e) {
                              console.error("Failed to start task", e);
                            }
                          }}
                        >
                          {task.status === "Pending"
                            ? "Start Task"
                            : "Start Task"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            : null}
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

      <ConfirmationDialog
        isOpen={confirmOpen}
        onCloseAction={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        onConfirmAction={onConfirmDelete}
        title="Delete task?"
        description="This action cannot be undone. The task will be permanently deleted."
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
      />
    </div>
  );
}
