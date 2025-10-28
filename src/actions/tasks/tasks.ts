"use server";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getEmployee } from "../hr/employees";
import {
  and,
  type asc,
  type desc,
  DrizzleQueryError,
  eq,
  type or,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CreateTask } from "@/types";

export async function createTask(taskData: CreateTask) {
  try {
    const manager = await getEmployee(taskData.assignedBy);
    if (!manager || !manager.isManager) {
      return {
        success: null,
        error: { reason: "Only managers can create tasks" },
      };
    }

    await db.insert(tasks).values({
      ...taskData,
    });

    revalidatePath("/tasks/history");
    return {
      success: { reason: "Task created successfully" },
      error: null,
    };
  } catch (err) {
    console.error("Error creating task:", err);
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }
    return {
      success: null,
      error: { reason: "An unexpected error occurred" },
    };
  }
}

export async function updateTask(
  employeeId: number,
  taskId: number,
  updates: Partial<CreateTask>,
) {
  console.log("Updates:", updates);
  const employee = await getEmployee(employeeId);
  if (!employee) {
    return {
      success: null,
      error: { reason: "Employee not found" },
    };
  }

  type TaskInsert = typeof tasks.$inferInsert;
  type TaskUpdate = Partial<TaskInsert>;
  const processedUpdates: TaskUpdate = {
    ...updates,
    updatedAt: new Date(),
  } as TaskUpdate;

  // Normalize empty string fields to null where applicable
  const normalized = { ...processedUpdates } as Record<string, unknown>;
  for (const [key, value] of Object.entries(normalized)) {
    if (value === "") {
      normalized[key] = null;
    }
  }

  try {
    await db
      .update(tasks)
      .set(normalized as unknown as TaskUpdate)
      .where(eq(tasks.id, taskId));

    revalidatePath("/tasks/history");
    return {
      success: { reason: "Task updated successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }
    return {
      success: null,
      error: { reason: "An unexpected error occurred" },
    };
  }
}

export async function deleteTask(employeeId: number, taskId: number) {
  try {
    const manager = await getEmployee(employeeId);
    if (!manager || !manager.isManager) {
      return {
        success: null,
        error: { reason: "Only managers can delete tasks" },
      };
    }
    await db.delete(tasks).where(eq(tasks.id, taskId));

    revalidatePath("/tasks");
    return {
      success: { reason: "Task deleted successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }
    return {
      success: null,
      error: { reason: "An unexpected error occurred" },
    };
  }
}

export async function getTasksForEmployee(
  where: ReturnType<typeof or> | ReturnType<typeof eq> | undefined,
  order: ReturnType<typeof asc> | ReturnType<typeof desc>,
  limit: number = 10,
  offset: number = 0,
) {
  const rows = await db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(order)
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function getTaskForEmployee(employeeId: number, taskId: number) {
  return await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.assignedTo, employeeId)))
    .limit(1)
    .then((res) => res[0]);
}

export async function getTaskByManager(managerId: number, taskId: number) {
  return await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.assignedBy, managerId)))
    .limit(1)
    .then((res) => res[0]);
}
