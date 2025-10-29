"use server";

import { db } from "@/db";
import { employees, taskReviews, taskSubmissions, tasks } from "@/db/schema";
import { getEmployee } from "../hr/employees";
import { DrizzleQueryError, and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type NewSubmission = typeof taskSubmissions.$inferInsert;

export async function submitTask(submissionData: NewSubmission) {
  try {
    const employee = await getEmployee(submissionData.submittedBy);

    if (!employee || employee.isManager) {
      return {
        success: null,
        error: { reason: "Only employees can submit tasks" },
      };
    }

    await db.insert(taskSubmissions).values({
      ...submissionData,
    });

    revalidatePath("/tasks");
    return {
      success: { reason: "Task submitted successfully" },
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

export async function getTaskSubmissions(taskId: number) {
  return await db
    .select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.taskId, taskId));
}

export async function getEmployeeSubmissions(employeeId: number) {
  return await db
    .select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.submittedBy, employeeId));
}

export async function getSubmissionById(submissionId: number) {
  return await db
    .select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.id, submissionId))
    .limit(1)
    .then((res) => res[0]);
}

export async function getManagerTeamSubmissions(managerId: number) {
  // All submissions for tasks assigned by this manager
  const rows = await db
    .select({
      id: taskSubmissions.id,
      taskId: taskSubmissions.taskId,
      submittedBy: taskSubmissions.submittedBy,
      submissionNote: taskSubmissions.submissionNote,
      submittedFiles: taskSubmissions.submittedFiles,
      submittedAt: taskSubmissions.submittedAt,
      employeeName: employees.name,
      taskTitle: tasks.title,
    })
    .from(taskSubmissions)
    .leftJoin(tasks, eq(tasks.id, taskSubmissions.taskId))
    .leftJoin(employees, eq(employees.id, taskSubmissions.submittedBy))
    .where(eq(tasks.assignedBy, managerId))
    .orderBy(desc(taskSubmissions.submittedAt));
  return rows;
}

export async function createSubmissionReview(args: {
  submissionId: number;
  taskId: number;
  reviewedBy: number;
  status: "Accepted" | "Rejected";
  reviewNote?: string;
}) {
  try {
    // Validate the reviewer is the manager who assigned the task
    const t = await db
      .select({ assignedBy: tasks.assignedBy })
      .from(tasks)
      .where(and(eq(tasks.id, args.taskId)))
      .limit(1)
      .then((r) => r[0]);
    if (!t || t.assignedBy !== args.reviewedBy) {
      return {
        success: null,
        error: {
          reason: "Only the assigning manager can review this submission",
        },
      };
    }

    await db.insert(taskReviews).values({
      taskId: args.taskId,
      submissionId: args.submissionId,
      reviewedBy: args.reviewedBy,
      status: args.status,
      reviewNote: args.reviewNote,
    });

    revalidatePath(`/tasks/manager`);
    return { success: { reason: "Review submitted" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return { success: null, error: { reason: err.cause?.message } };
    }
    return { success: null, error: { reason: "An unexpected error occurred" } };
  }
}
