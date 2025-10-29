"use server";

import { db } from "@/db";
import { tasks, taskAssignees } from "@/db/schema";
import { getEmployee } from "../hr/employees";
import {
  and,
  type asc,
  type desc,
  DrizzleQueryError,
  eq,
  or,
  inArray,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CreateTask } from "@/types";

type CreateTaskWithAssignees = CreateTask & { assignees?: number[] };

export async function createTask(taskData: CreateTaskWithAssignees) {
  try {
    const manager = await getEmployee(taskData.assignedBy);
    if (!manager || !manager.isManager) {
      return {
        success: null,
        error: { reason: "Only managers can create tasks" },
      };
    }

    const assignees = (taskData.assignees || []).filter(Boolean);
    const firstAssignee = assignees[0] ?? taskData.assignedTo ?? null;

    const [created] = await db
      .insert(tasks)
      .values({
        ...taskData,
        assignedTo: firstAssignee ?? undefined,
      })
      .returning({ id: tasks.id });

    if (created?.id && assignees.length) {
      const rows = assignees.map((empId) => ({
        taskId: created.id,
        employeeId: empId,
      }));
      await db.insert(taskAssignees).values(rows);
    }

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
  // Enforce permissions:
  // - Managers can update any fields on tasks they created
  // - Employees can only update the status of tasks they are assigned to
  let allowedUpdates: Partial<CreateTask> = { ...updates };
  if (!employee.isManager) {
    // Filter down to only status for non-managers
    allowedUpdates = {} as Partial<CreateTask>;
    if (typeof updates.status !== "undefined") {
      allowedUpdates.status = updates.status;
    }
    // If nothing to update after filtering, exit early
    if (Object.keys(allowedUpdates).length === 0) {
      return {
        success: null,
        error: { reason: "Employees can only update task status" },
      };
    }
    // Ensure employee has access to this task (either directly assigned or via assignees table)
    const taskVisible = await getTaskForEmployee(employeeId, taskId);
    if (!taskVisible) {
      return {
        success: null,
        error: { reason: "You are not assigned to this task" },
      };
    }
  } else {
    // Manager path: ensure the task belongs to this manager
    const taskOwned = await getTaskByManager(employeeId, taskId);
    if (!taskOwned) {
      return {
        success: null,
        error: { reason: "You can only update tasks you created" },
      };
    }
  }

  const processedUpdates: TaskUpdate = {
    ...allowedUpdates,
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
    // Additional safety: if employee is a manager, optionally ensure they own the task; otherwise just by id
    if (employee.isManager) {
      await db
        .update(tasks)
        .set(normalized as unknown as TaskUpdate)
        .where(eq(tasks.id, taskId));
    } else {
      await db
        .update(tasks)
        .set(normalized as unknown as TaskUpdate)
        .where(eq(tasks.id, taskId));
    }

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
  where:
    | ReturnType<typeof or>
    | ReturnType<typeof eq>
    | ReturnType<typeof and>
    | undefined,
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
  // A task is visible to an employee if either it's directly assignedTo them
  // or they appear in task_assignees for that task.
  const ids = await db
    .select({ id: taskAssignees.taskId })
    .from(taskAssignees)
    .where(eq(taskAssignees.employeeId, employeeId));
  const taskIds = ids.map((r) => r.id);

  return await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        or(eq(tasks.assignedTo, employeeId), inArray(tasks.id, taskIds)),
      ),
    )
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

// Returns all tasks created by a given manager
export async function getTasksByManager(managerId: number) {
  return await db.select().from(tasks).where(eq(tasks.assignedBy, managerId));
}
