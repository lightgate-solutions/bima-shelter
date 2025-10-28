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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
  assignedTo: z.number(),
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
    assignedTo: number | null;
  };
  const [info, setInfo] = useState<FormInfo>({
    title: "",
    description: "",
    priority: "Medium",
    status: "Pending",
    dueDate: date,
    assignedTo: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [subordinates, setSubordinates] = useState<
    Array<{ id: number; name: string; email: string; department: string }>
  >([]);
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchSubordinates = useCallback(
    async (query: string) => {
      const id = user?.id;
      console.log(id);
      if (!id) return;
      setLoading(true);
      try {
        const response = await fetch(
          `/api/hr/employees/subordinates?employeeId=${id}&q=${encodeURIComponent(query || "")}`,
        );
        const data = await response.json();
        setSubordinates(data.subordinates || []);
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  // Debounced search as user types
  useEffect(() => {
    if (!q.trim()) {
      setSubordinates([]);
      setSearched(false);
      return;
    }
    const t = setTimeout(() => {
      fetchSubordinates(q);
      setSearched(true);
    }, 400);
    return () => clearTimeout(t);
  }, [q, fetchSubordinates]);

  const handleSearch = () => {
    fetchSubordinates(q);
    setSearched(true);
  };

  const toggleAssignee = (id: number) => {
    setAssignedTo((prev) => {
      const next = prev === id ? null : id;
      setInfo((prevInfo) => ({ ...prevInfo, assignedTo: next }));
      setErrors((e) => ({ ...e, assignedTo: undefined }));
      return next;
    });
  };

  const selectedAssignee = subordinates.find((s) => s.id === assignedTo);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      const payload: Partial<TaskInput> = {
        ...info,
        assignedTo: info.assignedTo ?? undefined,
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
            if (key === "assignedTo") {
              fieldErrors[key] = "Assigned employee is required";
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
        body: JSON.stringify(result.data),
      });
      if (!response.ok) {
        const data = await response.json();
        console.error("Error response:", data);
        setErrors({
          assignedTo: data.error?.reason || "Failed to submit task",
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
        <h3 className="text-sm font-medium mb-2">Assign Employee</h3>

        <div className="flex items-center gap-2 mb-3">
          <Input
            placeholder="Search employees by name or email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="max-w-sm"
          />
          <Button type="button" onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
          {q ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQ("");
                setSubordinates([]);
                setSearched(false);
              }}
              disabled={loading}
            >
              Clear
            </Button>
          ) : null}
        </div>

        {selectedAssignee ? (
          <div className="text-sm mb-3">
            Assigned to: {selectedAssignee.name} ({selectedAssignee.email})
          </div>
        ) : null}
        {errors.assignedTo ? (
          <p className="text-sm text-red-500 mb-3">{errors.assignedTo}</p>
        ) : null}

        {loading ? (
          <p>Loading employees...</p>
        ) : !searched ? (
          <p>Start typing a name or email, then press Enter or click Search.</p>
        ) : subordinates.length === 0 ? (
          <p>No employees found.</p>
        ) : (
          <div>
            <Table>
              <TableCaption>
                A list of employees you can assign tasks.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subordinates.map((subordinate) => (
                  <TableRow key={subordinate.id}>
                    <TableCell className="font-medium">
                      {subordinate.name}
                    </TableCell>
                    <TableCell>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="assignedTo"
                          checked={assignedTo === subordinate.id}
                          onChange={() => toggleAssignee(subordinate.id)}
                        />
                        <span>{subordinate.email}</span>
                      </label>
                    </TableCell>
                    <TableCell>{subordinate.department}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant={
                          assignedTo === subordinate.id
                            ? "secondary"
                            : "outline"
                        }
                        onClick={() => toggleAssignee(subordinate.id)}
                      >
                        {assignedTo === subordinate.id ? "Unassign" : "Assign"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
