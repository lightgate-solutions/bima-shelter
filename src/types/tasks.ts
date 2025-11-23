import type { tasks } from "@/db/schema";

export interface GetTasksOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  assignedTo?: number;
  assignedBy?: number;
  status?:
    | "Backlog"
    | "Todo"
    | "In Progress"
    | "Technical Review"
    | "Paused"
    | "Completed";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  dueDateFrom?: Date;
}

export type CreateTask = typeof tasks.$inferInsert;
export type Task = typeof tasks.$inferSelect;
