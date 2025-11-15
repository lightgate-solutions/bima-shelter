"use server";

import { db } from "@/db";
import { employees } from "@/db/schema";
import {
  DrizzleQueryError,
  and,
  or,
  ilike,
  lt,
  gt,
  eq,
  desc,
  asc
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

/* =========================
 * Cursor-paginated listing
 * =========================
 * - Stable cursor on (createdAt DESC, id DESC)
 * - Server-side search over name/email/department/role/phone
 * - limit + 1 strategy to compute nextCursor
 */

export type EmployeeCursor = { createdAt: string; id: number };

export type EmployeeListParams = {
  limit?: number;                 // default 20, max 100
  cursor?: EmployeeCursor | null; // pagination cursor
  q?: string;                     // search text
};

export type EmployeeRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string | null;
  employmentType: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  staffNumber: string | null;
  createdAt: string;
};

export type EmployeeListResult = {
  items: EmployeeRow[];
  nextCursor: EmployeeCursor | null;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function listEmployees(
  params: EmployeeListParams = {}
): Promise<EmployeeListResult> {
  const { limit = DEFAULT_LIMIT, cursor = null, q } = params;

  const take = Math.min(Math.max(limit, 1), MAX_LIMIT) + 1; // fetch one extra

  // Search predicate
  const like = q
    ? or(
        ilike(employees.name, `%${q}%`),
        ilike(employees.email, `%${q}%`),
        ilike(employees.department, `%${q}%`),
        ilike(employees.role, `%${q}%`),
        ilike(employees.phone, `%${q}%`)
      )
    : undefined;

  // Cursor predicate for DESC order: (createdAt < cDate) OR (createdAt = cDate AND id < cursor.id)
  let cursorPred:
    | ReturnType<typeof and>
    | ReturnType<typeof or>
    | undefined;

  if (cursor) {
    const cDate = new Date(cursor.createdAt);
    cursorPred = or(
      lt(employees.createdAt, cDate),
      and(eq(employees.createdAt, cDate), lt(employees.id, cursor.id))
    );
  }

  const where = like ? (cursorPred ? and(like, cursorPred) : like) : cursorPred;

  const rows = await db
    .select({
      id: employees.id,
      email: employees.email,
      role: employees.role,
      name: employees.name,
      department: employees.department,
      employmentType: employees.employmentType,
      phone: employees.phone,
      dateOfBirth: employees.dateOfBirth,
      staffNumber: employees.staffNumber,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .where(where ?? undefined)
    .orderBy(desc(employees.createdAt), desc(employees.id))

    .limit(take);

  const hasMore = rows.length === take;
  const items = hasMore ? rows.slice(0, -1) : rows;

  const last = items[items.length - 1];
  const nextCursor = last
    ? { createdAt: last.createdAt as unknown as string, id: last.id }
    : null;

    return { items: items as unknown as EmployeeRow[], nextCursor };
}

/* =========================
 * Legacy helpers (kept)
 * =========================
 * Keep these for compatibility while we migrate the UI.
 * Prefer listEmployees() for lists.
 */

export async function getAllEmployees() {
  // Legacy: capped to avoid exhausting memory
  return await db
    .select({
      id: employees.id,
      email: employees.email,
      role: employees.role,
      name: employees.name,
      department: employees.department,
      employmentType: employees.employmentType,
      phone: employees.phone,
      dateOfBirth: employees.dateOfBirth,
      staffNumber: employees.staffNumber,
    })
    .from(employees)
    .limit(200);
}

export async function getEmployee(employeeId: number) {
  return await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1)
    .then((res) => res[0]);
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
