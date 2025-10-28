"use server";

import { db } from "@/db";
import { taskSubmissions } from "@/db/schema";
import { getEmployee } from "../hr/employees";
import { DrizzleQueryError, eq } from "drizzle-orm";
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
