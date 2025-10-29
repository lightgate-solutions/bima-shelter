"use client";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";
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
// Removed table-based assignee selector
import type { User } from "@/types";

type Props = {
  user: User | null;
  onCompleted?: () => void;
  trigger: React.ReactNode;
};

const TaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  status: z
    .enum(["all", "Pending", "In Progress", "Completed", "Overdue"])
    .optional(),
  dueDate: z.preprocess((v) => (v instanceof Date ? v : undefined), z.date()),
  assignees: z.array(z.number()).min(1, "Select at least one employee"),
  assignedBy: z.number().optional(),
});
type TaskInput = z.infer<typeof TaskSchema>;
type FormErrors = Partial<Record<keyof TaskInput, string>>;

export function TaskFormDialog({
  user,
  onCompleted,
  trigger: _trigger,
}: Props) {
  const [date, setDate] = useState<Date | undefined>();
  type FormInfo = {
    title: string;
    description: string;
    priority: TaskInput["priority"];
    status: TaskInput["status"];
    dueDate: Date | undefined;
    assignees: number[];
  };
  const [info, setInfo] = useState<FormInfo>({
    title: "",
    description: "",
    priority: "Medium",
    status: "Pending",
    dueDate: date,
    assignees: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [assignees, setAssignees] = useState<number[]>([]);
  const [subordinates, setSubordinates] = useState<
    Array<{ id: number; name: string; email: string; department: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchSubordinates = useCallback(async () => {
    const id = user?.id;
    console.log(id);
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/hr/employees/subordinates?employeeId=${id}`,
      );
      const data = await response.json();
      setSubordinates(data.subordinates || []);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubordinates();
  }, [fetchSubordinates]);

  const addAssignee = (id: number) => {
    setAssignees((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      setInfo((pi) => ({ ...pi, assignees: next }));
      setErrors((e) => ({ ...e, assignees: undefined }));
      return next;
    });
  };
  const removeAssignee = (id: number) => {
    setAssignees((prev) => {
      const next = prev.filter((x) => x !== id);
      setInfo((pi) => ({ ...pi, assignees: next }));
      return next;
    });
  };

  const selectedAssignees = subordinates.filter((s) =>
    assignees.includes(s.id),
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      const payload: Partial<TaskInput> = {
        ...info,
        dueDate: info.dueDate,
        assignedBy: user?.id ?? undefined,
      };

      const result = TaskSchema.safeParse(payload);
      if (!result.success) {
        const fieldErrors: FormErrors = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof TaskInput | undefined;
          if (key) {
            // Provide clearer messages for required fields
            if (key === "assignees") {
              fieldErrors[key] = "Select at least one employee";
            } else if (key === "dueDate") {
              fieldErrors[key] = "Due date is required";
            } else {
              fieldErrors[key] = issue.message;
            }
          }
        }
        setErrors(fieldErrors);
        return;
      }
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data }),
      });
      if (!response.ok) {
        const data = await response.json();
        console.error("Error response:", data);
        setErrors({
          assignees: data.error?.reason || "Failed to submit task",
        });
        return;
      }
      // Success: clear errors, invoke completion callback
      setErrors({});
      onCompleted?.();
    } catch (error) {
      console.error("Error submitting task:", error);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <form
            className="mt-3"
            id="taskForm"
            onSubmit={handleSubmit}
            noValidate
          >
            <FieldGroup>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="title">Task Title</FieldLabel>
                    <Input
                      id="title"
                      placeholder="Enter task title..."
                      required
                      value={info.title}
                      onChange={(e) => {
                        setInfo({ ...info, title: e.target.value });
                        setErrors((er) => ({ ...er, title: undefined }));
                      }}
                      aria-invalid={!!errors.title}
                    />
                    {errors.title ? (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.title}
                      </p>
                    ) : null}
                  </Field>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor="priority">Priority</FieldLabel>
                      <Select
                        defaultValue="Medium"
                        onValueChange={(value) => {
                          setInfo({
                            ...info,
                            priority: value as FormInfo["priority"],
                          });
                          setErrors((er) => ({ ...er, priority: undefined }));
                        }}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low Priority</SelectItem>
                          <SelectItem value="Medium">
                            Medium Priority
                          </SelectItem>
                          <SelectItem value="High">High Priority</SelectItem>
                          <SelectItem value="Urgent">
                            Urgent Priority
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Due Date</FieldLabel>
                      <DateTimePicker
                        date={date}
                        setDate={(d) => {
                          setDate(d);
                          setInfo({ ...info, dueDate: d ?? undefined });
                          setErrors((er) => ({ ...er, dueDate: undefined }));
                        }}
                      />
                      {errors.dueDate ? (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.dueDate}
                        </p>
                      ) : null}
                    </Field>
                  </div>
                </FieldGroup>
              </FieldSet>
              <FieldSeparator />
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed description of the task..."
                      className="resize-none"
                      value={info.description}
                      onChange={(e) => {
                        setInfo({ ...info, description: e.target.value });
                        setErrors((er) => ({ ...er, description: undefined }));
                      }}
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Assign Employees</h3>
        {errors.assignees ? (
          <p className="text-sm text-red-500 mb-2">{errors.assignees}</p>
        ) : null}

        <div className="max-w-sm">
          <Select onValueChange={(val) => addAssignee(Number(val))}>
            <SelectTrigger>
              <SelectValue
                placeholder={loading ? "Loading..." : "Add employee"}
              />
            </SelectTrigger>
            <SelectContent>
              {subordinates.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name} ({s.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAssignees.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No employees selected.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {selectedAssignees.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                >
                  <span>
                    {s.name} ({s.email})
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => removeAssignee(s.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit actions moved after Assign Employee section */}
        <div className="mt-4">
          <Field orientation="horizontal">
            <Button type="submit" form="taskForm">
              {loading ? "Submitting..." : "Submit"}
            </Button>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Field>
        </div>
      </div>
    </div>
  );
}
