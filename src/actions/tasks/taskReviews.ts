"use server";

import { db } from "@/db";
import { taskReviews } from "@/db/schema";
import { getEmployee } from "../hr/employees";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type NewReview = typeof taskReviews.$inferInsert;

export const reviewTask = async (reviewData: NewReview) => {
  try {
    const manager = await getEmployee(reviewData.reviewedBy);

    if (!manager || !manager.isManager) {
      return {
        success: null,
        error: { reason: "Only managers can review tasks" },
      };
    }

    await db.insert(taskReviews).values({
      ...reviewData,
    });

    revalidatePath("/tasks");
    return {
      success: { reason: "Task reviewed successfully" },
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
};

export const getSubmissionReviews = async (submissionId: number) => {
  return await db
    .select()
    .from(taskReviews)
    .where(eq(taskReviews.submissionId, submissionId));
};
