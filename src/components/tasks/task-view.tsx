"use client";

import { useEffect, useMemo, useState } from "react";
import type { Task, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TaskChatDialog } from "@/components/tasks/task-chat-dialog";
import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";
import { TaskSubmit } from "@/components/tasks/task-submit";

type Props = {
  taskId: number;
  user: User | null;
};

type ViewTask = Task & {
  assignedToEmail?: string | null;
  assignedByEmail?: string | null;
  assignedToName?: string | null;
  assignedByName?: string | null;
  assignees?: { id: number; email: string | null; name: string | null }[];
};

export function TaskView({ taskId, user }: Props) {
  const [task, setTask] = useState<ViewTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = useMemo(
    () => (user?.isManager ? "manager" : "employee"),
    [user?.isManager],
  );

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/tasks/${taskId}?employeeId=${user.id}&role=${role}`,
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Failed to load task ${taskId}`);
        }
        const data = await res.json();
        if (active) setTask(data.task as Task);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error loading task";
        if (active) setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [taskId, user?.id, role]);

  function formatDate(val?: unknown) {
    if (!val) return "N/A";
    try {
      const d = typeof val === "string" ? new Date(val) : (val as Date);
      if (!(d instanceof Date) || Number.isNaN(d.getTime())) return String(val);
      return d.toLocaleString();
    } catch {
      return String(val);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Separator />

        {/* Employee submission area (hidden for managers) */}
        <TaskSubmit taskId={taskId} user={user} />
        <p className="text-sm text-muted-foreground">Full task information</p>
      </div>
      <Separator />

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && <div className="text-sm text-destructive">Error: {error}</div>}

      {task && (
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-lg font-medium break-words">{task.title}</h4>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary">{task.status}</Badge>
                <Badge>{task.priority}</Badge>
              </div>
            </div>
            {task.description ? (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                  Task Description
                </h5>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground italic">
                No description provided
              </p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">Assigned to</div>
              {Array.isArray(task.assignees) && task.assignees.length > 0 ? (
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
                <div className="text-sm font-medium">
                  {task.assignedToEmail || task.assignedToName
                    ? `${task.assignedToName ?? task.assignedToEmail} `
                    : ""}
                  #{task.assignedTo}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">Assigned by</div>
              <div className="text-sm font-medium">
                {task.assignedByEmail || task.assignedByName
                  ? `${task.assignedByName ?? task.assignedByEmail} `
                  : ""}
                #{task.assignedBy}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">Due date</div>
              <div className="text-sm font-medium">
                {formatDate(task.dueDate)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">Created</div>
              <div className="text-sm font-medium">
                {formatDate(task.createdAt)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">Updated</div>
              <div className="text-sm font-medium">
                {formatDate(task.updatedAt)}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <TaskChatDialog
              taskId={taskId}
              user={user}
              title={task ? `Chat • ${task.title}` : "Task Chat"}
              trigger={
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Open chat
                </Button>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskView;
