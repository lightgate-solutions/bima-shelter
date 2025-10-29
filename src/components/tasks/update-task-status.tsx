"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { User, Task } from "@/types";

export function UpdateTaskStatus({
  taskId,
  user,
  onUpdated,
}: {
  taskId: number;
  user: User | null;
  onUpdated?: (task: Task) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("Pending");

  const loadTask = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const role = user?.isManager ? "manager" : "employee";
      const res = await fetch(
        `/api/tasks/${taskId}?employeeId=${user.id}&role=${role}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.task?.status ?? "Pending");
    } finally {
      setLoading(false);
    }
  }, [taskId, user?.id, user?.isManager]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const role = user?.isManager ? "manager" : "employee";
      const res = await fetch(
        `/api/tasks/${taskId}?employeeId=${user.id}&role=${role}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (onUpdated && body?.task) onUpdated(body.task);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium">Status</div>
        <Select value={status} onValueChange={setStatus} disabled={loading}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
