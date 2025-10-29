import { NextResponse, type NextRequest } from "next/server";
import { getTasksForEmployee, createTask } from "@/actions/tasks/tasks";
import type { CreateTask, Task } from "@/types";
import { and, asc, desc, eq, ilike, or, inArray } from "drizzle-orm";
import { db } from "@/db";
import { tasks, taskAssignees } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateTask> & {
      assignees?: number[];
    };
    const created = await createTask(
      body as CreateTask & { assignees?: number[] },
    );

    if (!created.success) {
      return NextResponse.json(
        { error: created.error?.reason || "Task not created" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: created.success.reason });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    type StatusType = "Pending" | "In Progress" | "Completed" | "Overdue";
    type PriorityType = "Low" | "Medium" | "High" | "Urgent";
    const { searchParams } = request.nextUrl;

    const role = searchParams.get("role") || undefined;
    const employeeId = searchParams.get("employeeId");
    if (!employeeId || !role) {
      return NextResponse.json(
        { error: "Missing employeeId or role parameter" },
        { status: 400 },
      );
    }
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const sortableColumns = {
      createdAt: tasks.createdAt,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assignedTo: tasks.assignedTo,
      assignedBy: tasks.assignedBy,
    };
    type SortableColumn = keyof typeof sortableColumns;

    const sortByParam = searchParams.get("sortBy") as SortableColumn | null;
    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority") || undefined;
    const q = searchParams.get("q") || "";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";
    const sortColumn =
      (sortByParam && sortableColumns[sortByParam]) || tasks.createdAt;
    const order = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

    let where: ReturnType<typeof or> | ReturnType<typeof eq> | undefined;
    if (role === "employee") {
      const eid = parseInt(employeeId || "0");
      // Fetch tasks where employee is explicitly assigned via join table
      const rows = await db
        .select({ id: taskAssignees.taskId })
        .from(taskAssignees)
        .where(eq(taskAssignees.employeeId, eid));
      const ids = rows.map((r) => r.id);
      where = ids.length
        ? or(eq(tasks.assignedTo, eid), inArray(tasks.id, ids))
        : eq(tasks.assignedTo, eid);
    } else if (role === "manager") {
      where = eq(tasks.assignedBy, parseInt(employeeId || "0"));
    }

    if (q) {
      where = where
        ? and(
            where,
            or(
              ilike(tasks.title, `%${q}%`),
              ilike(tasks.description, `%${q}%`),
            ),
          )
        : or(ilike(tasks.title, `%${q}%`), ilike(tasks.description, `%${q}%`));
    }
    if (status && status !== "all") {
      where = where
        ? and(where, eq(tasks.status, status as StatusType))
        : eq(tasks.status, status as StatusType);
    }
    console.log("Status: ", status);
    if (priority) {
      where = where
        ? and(where, eq(tasks.priority, priority as PriorityType))
        : eq(tasks.priority, priority as PriorityType);
    }
    const all_tasks: Task[] = await getTasksForEmployee(
      where,
      order,
      limit,
      offset,
    );
    return NextResponse.json({ tasks: all_tasks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
