/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
"use client";

import { useEffect, useState } from "react";
import { TaskColumn } from "./task-column";
import type { BoardTask, Status, StatusType } from "../types";
import {
  CalendarCheck2,
  Circle,
  CircleDotDashed,
  Hourglass,
  Loader2,
  Timer,
} from "lucide-react";

const statusConfig: Status[] = [
  { id: "Backlog", name: "Backlog", color: "#53565A", icon: CircleDotDashed },
  { id: "Todo", name: "Todo", color: "#53565A", icon: Circle },
  {
    id: "In Progress",
    name: "In Progress",
    color: "#facc15",
    icon: Timer,
  },
  {
    id: "Review",
    name: "Review",
    color: "#22c55e",
    icon: Hourglass,
  },
  {
    id: "Completed",
    name: "Completed",
    color: "#8b5cf6",
    icon: CalendarCheck2,
  },
];

interface TaskBoardProps {
  employeeId: number;
  role: "employee" | "manager" | "admin";
  priority?: string;
  assignee?: string;
  search?: string;
}

export function TaskBoard({
  employeeId,
  role,
  priority,
  assignee,
  search,
}: TaskBoardProps) {
  const [tasksByStatus, setTasksByStatus] = useState<
    Record<StatusType, BoardTask[]>
  >({
    Backlog: [],
    Todo: [],
    "In Progress": [],
    Review: [],
    Completed: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({
        employeeId: employeeId.toString(),
        role,
      });

      if (priority && priority !== "all") {
        params.set("priority", priority);
      }
      if (assignee) {
        params.set("assignee", assignee);
      }
      if (search) {
        params.set("q", search);
      }

      const res = await fetch(`/api/tasks/board?${params.toString()}`);
      const data = await res.json();

      if (data.tasksByStatus) {
        setTasksByStatus(data.tasksByStatus);
      }
    } catch (error) {
      console.error("Error fetching board tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [employeeId, role, priority, assignee, search]);

  // Listen for task changes
  useEffect(() => {
    const handleTasksChanged = () => {
      fetchTasks();
    };

    window.addEventListener("tasks:changed", handleTasksChanged);
    return () => {
      window.removeEventListener("tasks:changed", handleTasksChanged);
    };
  }, []);

  const handleStatusChange = async (taskId: number, newStatus: StatusType) => {
    try {
      await fetch("/api/tasks/board", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });

      // Refresh tasks
      fetchTasks();
      window.dispatchEvent(new CustomEvent("tasks:changed"));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-3 px-3 pt-4 pb-2 overflow-hidden">
      {statusConfig.map((status) => (
        <TaskColumn
          key={status.id}
          status={status}
          tasks={tasksByStatus[status.name] || []}
          onStatusChange={handleStatusChange}
          employeeId={employeeId}
          role={role}
        />
      ))}
    </div>
  );
}
