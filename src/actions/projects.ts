"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { DrizzleQueryError, asc, desc, eq, ilike, or } from "drizzle-orm";
import { createNotification } from "./notification/notification";

export type ProjectInput = {
  name: string;
  description?: string | null;
  location?: string | null;
  supervisorId?: number | null;
  budgetPlanned?: number;
  budgetActual?: number;
};

export async function listProjects(params: {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?:
    | "id"
    | "name"
    | "code"
    | "description"
    | "location"
    | "status"
    | "budgetPlanned"
    | "budgetActual"
    | "supervisorId"
    | "createdAt"
    | "updatedAt";
  sortDirection?: "asc" | "desc";
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const offset = (page - 1) * limit;
  const q = params.q ?? "";
  const sortBy = params.sortBy ?? "createdAt";
  const sortDirection = params.sortDirection === "asc" ? "asc" : "desc";

  const where = q
    ? or(
        ilike(projects.name, `%${q}%`),
        ilike(projects.code, `%${q}%`),
        ilike(projects.location, `%${q}%`),
      )
    : undefined;

  const totalRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(where);
  const total = totalRows.length;

  const order =
    sortDirection === "asc" ? asc(projects[sortBy]) : desc(projects[sortBy]);

  const rows = await db
    .select()
    .from(projects)
    .where(where)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  return {
    projects: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createProject(input: ProjectInput) {
  try {
    // Generate code like 1BM, 2BM, ... based on max existing id
    const { sql } = await import("drizzle-orm");
    const [{ maxId }] = await db
      .select({ maxId: sql<number>`max(${projects.id})` })
      .from(projects);
    const nextId = (maxId ?? 0) + 1;
    const generatedCode = `${nextId}BM`;

    const [row] = await db
      .insert(projects)
      .values({
        name: input.name,
        code: generatedCode,
        description: input.description ?? null,
        location: input.location ?? null,
        supervisorId: input.supervisorId ?? null,
        budgetPlanned: input.budgetPlanned ?? 0,
        budgetActual: input.budgetActual ?? 0,
      })
      .returning();

    // Notify supervisor if assigned
    if (row.supervisorId) {
      await createNotification({
        user_id: row.supervisorId,
        title: "Assigned as Project Supervisor",
        message: `You've been assigned as supervisor for project: ${row.name} (${row.code})`,
        notification_type: "message",
        reference_id: row.id,
      });
    }

    return { project: row, error: null };
  } catch (err) {
    const message =
      err instanceof DrizzleQueryError
        ? err.cause?.message
        : "Could not create project";
    return { project: null, error: { reason: message } };
  }
}

export async function updateProject(id: number, input: Partial<ProjectInput>) {
  try {
    // Get the current project before updating
    const currentProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1)
      .then((r) => r[0]);

    const [row] = await db
      .update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    // Notify if supervisor changed
    if (
      input.supervisorId !== undefined &&
      input.supervisorId !== currentProject?.supervisorId &&
      input.supervisorId !== null
    ) {
      await createNotification({
        user_id: input.supervisorId,
        title: "Assigned as Project Supervisor",
        message: `You've been assigned as supervisor for project: ${row.name} (${row.code})`,
        notification_type: "message",
        reference_id: row.id,
      });
    }

    return { project: row, error: null };
  } catch (err) {
    const message =
      err instanceof DrizzleQueryError
        ? err.cause?.message
        : "Could not update project";
    return { project: null, error: { reason: message } };
  }
}

export async function deleteProject(id: number) {
  try {
    await db.delete(projects).where(eq(projects.id, id));
    return { success: true, error: null };
  } catch (err) {
    const message =
      err instanceof DrizzleQueryError
        ? err.cause?.message
        : "Could not delete project";
    return { success: false, error: { reason: message } };
  }
}
