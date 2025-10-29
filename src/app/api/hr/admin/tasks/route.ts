import { getTasksForEmployee } from "@/actions/tasks/tasks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Task } from "@/types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { employees, taskAssignees, tasks } from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Enforce admin access
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Filters and pagination
    type StatusType = "Pending" | "In Progress" | "Completed" | "Overdue";
    type PriorityType = "Low" | "Medium" | "High" | "Urgent";

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority") || undefined;
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";
    const sortBy = searchParams.get("sortBy") || "createdAt";

    const sortableColumns = {
      createdAt: tasks.createdAt,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assignedTo: tasks.assignedTo,
      assignedBy: tasks.assignedBy,
    } as const;
    type SortableColumn = keyof typeof sortableColumns;
    let sortColumn =
      tasks.createdAt as (typeof sortableColumns)[SortableColumn];
    if (sortBy && sortBy in sortableColumns) {
      sortColumn = sortableColumns[sortBy as SortableColumn];
    }
    const order = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

    const managerIdParam = searchParams.get("managerId");
    const employeeIdParam = searchParams.get("employeeId");

    let where:
      | ReturnType<typeof or>
      | ReturnType<typeof eq>
      | ReturnType<typeof and>
      | undefined;

    // Manager filter -> tasks created by this manager
    if (managerIdParam) {
      const managerIdNum = Number(managerIdParam);
      if (!Number.isNaN(managerIdNum)) {
        const cond = eq(tasks.assignedBy, managerIdNum);
        where = where ? and(where, cond) : cond;
      }
    }

    // Employee filter -> tasks assigned directly or included in assignees table
    if (employeeIdParam) {
      const eid = Number(employeeIdParam);
      if (!Number.isNaN(eid)) {
        const viaAssignees = await db
          .select({ id: taskAssignees.taskId })
          .from(taskAssignees)
          .where(eq(taskAssignees.employeeId, eid));
        const assigneeTaskIds = viaAssignees.map((r) => r.id);
        const employeeWhere = assigneeTaskIds.length
          ? or(eq(tasks.assignedTo, eid), inArray(tasks.id, assigneeTaskIds))
          : eq(tasks.assignedTo, eid);
        where = where ? and(where, employeeWhere) : employeeWhere;
      }
    }

    if (q) {
      const like = or(
        ilike(tasks.title, `%${q}%`),
        ilike(tasks.description, `%${q}%`),
      );
      where = where ? and(where, like) : like;
    }

    if (status && status !== "all") {
      const statusWhere = eq(tasks.status, status as StatusType);
      where = where ? and(where, statusWhere) : statusWhere;
    }

    if (priority) {
      const priorityWhere = eq(tasks.priority, priority as PriorityType);
      where = where ? and(where, priorityWhere) : priorityWhere;
    }

    // Fetch
    const all: Task[] = await getTasksForEmployee(where, order, limit, offset);

    // Enrich assigned names/emails
    const ids = Array.from(
      new Set(
        all
          .flatMap((t) => [t.assignedTo, t.assignedBy])
          .filter(Boolean) as number[],
      ),
    );
    let map = new Map<number, { email: string | null; name: string | null }>();
    if (ids.length) {
      const rows = await db
        .select({
          id: employees.id,
          email: employees.email,
          name: employees.name,
        })
        .from(employees)
        .where(inArray(employees.id, ids));
      map = new Map(rows.map((r) => [r.id, { email: r.email, name: r.name }]));
    }

    // Build assignees map for these tasks
    const taskIds = all.map((t) => t.id);
    const assigneesMap = new Map<
      number,
      { id: number; email: string | null; name: string | null }[]
    >();
    if (taskIds.length) {
      const assigneesRows = await db
        .select({
          taskId: taskAssignees.taskId,
          id: employees.id,
          email: employees.email,
          name: employees.name,
        })
        .from(taskAssignees)
        .leftJoin(employees, eq(employees.id, taskAssignees.employeeId))
        .where(inArray(taskAssignees.taskId, taskIds));
      for (const r of assigneesRows) {
        if (r.id != null) {
          const list = assigneesMap.get(r.taskId) ?? [];
          list.push({ id: r.id, email: r.email, name: r.name });
          assigneesMap.set(r.taskId, list);
        }
      }
    }

    const enriched = all.map((t) => ({
      ...t,
      assignedToEmail: map.get(t.assignedTo || -1)?.email ?? null,
      assignedByEmail: map.get(t.assignedBy || -1)?.email ?? null,
      assignedToName: map.get(t.assignedTo || -1)?.name ?? null,
      assignedByName: map.get(t.assignedBy || -1)?.name ?? null,
      assignees: assigneesMap.get(t.id) ?? [],
    }));

    return NextResponse.json({ tasks: enriched }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
