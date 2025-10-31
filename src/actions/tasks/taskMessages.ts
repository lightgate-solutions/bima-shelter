"use server";

import { db } from "@/db";
import { taskMessages, tasks, taskAssignees, employees } from "@/db/schema";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type NewMessage = typeof taskMessages.$inferInsert;

export const createTaskMessage = async (msg: NewMessage) => {
  try {
    // Ensure the task exists and the sender is either assignedBy or assignedTo
    const t = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, msg.taskId))
      .limit(1)
      .then((r) => r[0]);

    if (!t) {
      return { success: null, error: { reason: "Task not found" } };
    }

    if (msg.senderId !== t.assignedBy && msg.senderId !== t.assignedTo) {
      // Check if sender is in additional assignees list
      const extra = await db
        .select({ employeeId: taskAssignees.employeeId })
        .from(taskAssignees)
        .where(eq(taskAssignees.taskId, msg.taskId));
      const extraIds = new Set(extra.map((r) => r.employeeId));
      if (!extraIds.has(msg.senderId)) {
        return {
          success: null,
          error: {
            reason: "Only assigned employees or the manager can post messages",
          },
        };
      }
    }

    await db.insert(taskMessages).values({ ...msg });
    // Revalidate task page so task view will pick up new messages if necessary
    revalidatePath(`/tasks/${msg.taskId}`);

    return { success: { reason: "Message posted" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return { success: null, error: { reason: err.cause?.message } };
    }
    return { success: null, error: { reason: "An unexpected error occurred" } };
  }
};

export const getMessagesForTask = async (taskId: number) => {
  return await db
    .select({
      id: taskMessages.id,
      taskId: taskMessages.taskId,
      senderId: taskMessages.senderId,
      content: taskMessages.content,
      createdAt: taskMessages.createdAt,
      senderName: employees.name,
      senderEmail: employees.email,
    })
    .from(taskMessages)
    .leftJoin(employees, eq(employees.id, taskMessages.senderId))
    .where(eq(taskMessages.taskId, taskId))
    .orderBy(taskMessages.createdAt);
};
