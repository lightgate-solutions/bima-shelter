"use client";
import { useEffect, useState, useCallback } from "react";
import { z } from "zod";

import { Field, FieldLabel, FieldSeparator, FieldSet } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { DateTimePicker } from "../ui/date-time";
import type { User, Task } from "@/types";

export function UpdateTask({
  taskId,
  user,
  onUpdated,
}: {
  taskId: number;
  user: User | null;
  onUpdated?: (task: Task) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<string>("Medium");

  const loadTask = useCallback(async () => {
    setLoading(true);
    try {
      const role = user?.isManager ? "manager" : "employee";
      const res = await fetch(
        `/api/tasks/${taskId}?employeeId=${user?.id}&role=${role}`,
      );
      const data = await res.json();
      setDescription(data.task.description || "");
      setDueDate(data.task.dueDate ? new Date(data.task.dueDate) : undefined);
      setPriority(data.task.priority || data.task.status || "Medium");
    } catch (error) {
      console.error("Failed to load task", error);
    } finally {
      setLoading(false);
    }
  }, [taskId, user?.id, user?.isManager]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = z
        .object({
          description: z.string().nullable(),
          dueDate: z.date().nullable(),
          priority: z.string(),
        })
        .parse({
          description,
          dueDate,
          priority,
        });

      const role = user?.isManager ? "manager" : "employee";
      const res = await fetch(
        `/api/tasks/${taskId}?employeeId=${user?.id}&role=${role}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        const body = await res.json();
        const updated: Task | undefined = body?.task;
        if (onUpdated && updated) onUpdated(updated);
      } else {
        console.error("Failed to update task");
      }
    } catch (error) {
      console.error("Failed to update task", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FieldSet>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </Field>
        <FieldSeparator />
        <Field>
          <FieldLabel>Due Date</FieldLabel>
          <DateTimePicker date={dueDate} setDate={(d) => setDueDate(d)} />
        </Field>
        <FieldSeparator />
        <Field>
          <FieldLabel>Priority</FieldLabel>
          <Select
            value={priority}
            onValueChange={setPriority}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldSet>
      <div className="flex justify-end">
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? "Updating..." : "Update Task"}
        </Button>
      </div>
    </div>
  );
}
