"use server";

import { db } from "@/db";
import { employmentHistory } from "@/db/schema/hr";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth, requireHROrAdmin } from "@/actions/auth/dal";

const employmentHistorySchema = z.object({
  employeeId: z.number(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  department: z.string().nullable(),
  employmentType: z
    .enum(["Full-time", "Part-time", "Contract", "Intern"])
    .nullable(),
});

export type EmploymentHistoryFormValues = z.infer<
  typeof employmentHistorySchema
>;

export async function getEmployeeHistory(employeeId: number) {
  await requireAuth();
  try {
    const history = await db.query.employmentHistory.findMany({
      where: eq(employmentHistory.employeeId, employeeId),
      orderBy: (history) => [history.startDate],
    });

    return history;
  } catch (error) {
    console.error("Error fetching employee history:", error);
    throw new Error("Failed to fetch employee history");
  }
}

export async function addEmploymentHistory(data: EmploymentHistoryFormValues) {
  await requireHROrAdmin();
  try {
    await db.insert(employmentHistory).values({
      employeeId: data.employeeId,
      startDate: data.startDate
        ? new Date(data.startDate).toDateString()
        : null,
      endDate: data.endDate ? new Date(data.endDate).toDateString() : null,
      department: data.department || null,
      employmentType: data.employmentType || null,
    });

    revalidatePath(`/dashboard/hr/employees`);
    return { success: true };
  } catch (error) {
    console.error("Error adding employment history:", error);
    return { success: false, error: "Failed to add employment history" };
  }
}

export async function updateEmploymentHistory(
  id: number,
  data: EmploymentHistoryFormValues,
) {
  await requireHROrAdmin();
  try {
    await db
      .update(employmentHistory)
      .set({
        startDate: data.startDate
          ? new Date(data.startDate).toDateString()
          : null,
        endDate: data.endDate ? new Date(data.endDate).toDateString() : null,
        department: data.department || null,
        employmentType: data.employmentType || null,
        updatedAt: new Date(),
      })
      .where(eq(employmentHistory.id, id));

    revalidatePath(`/dashboard/hr/employees`);
    return { success: true };
  } catch (error) {
    console.error("Error updating employment history:", error);
    return { success: false, error: "Failed to update employment history" };
  }
}

// Delete an employment history record
export async function deleteEmploymentHistory(id: number) {
  await requireHROrAdmin();
  try {
    await db.delete(employmentHistory).where(eq(employmentHistory.id, id));

    revalidatePath(`/dashboard/hr/employees`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting employment history:", error);
    return { success: false, error: "Failed to delete employment history" };
  }
}
