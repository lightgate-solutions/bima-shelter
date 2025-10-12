/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
// biome-ignore-all lint/style/noNonNullAssertion: <>

"use server";

import { db } from "@/db";
import { employees } from "@/db/schema";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAllEmployees() {
  return await db
    .select({
      id: employees.id,
      email: employees.email,
      role: employees.role,
      name: employees.role,
      department: employees.department,
    })
    .from(employees);
}

export async function updateEmployee(
  employeeId: number,
  updates: Partial<{
    name: string;
    email: string;
    phone: string;
    staffNumber: string;
    department: string;
    managerId: number | null;
    dateOfBirth: string;
    address: string;
    maritalStatus: string;
    employmentType: string;
  }>,
) {
  const processedUpdates: any = { ...updates, updatedAt: new Date() };

  // Convert empty string fields to null
  for (const key in processedUpdates) {
    if (processedUpdates[key] === "") {
      processedUpdates[key] = null;
    }
  }
  try {
    await db
      .update(employees)
      .set(processedUpdates)
      .where(eq(employees.id, employeeId));

    revalidatePath("/hr/employees");
    return {
      success: { reason: "Employee updated successfully" },
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
      error: {
        reason: "Couldn't update employee. Check inputs and try again!",
      },
      success: null,
    };
  }
}
