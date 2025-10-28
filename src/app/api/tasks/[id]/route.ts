import { NextResponse, type NextRequest } from "next/server";
import {
  getTaskForEmployee,
  getTaskByManager,
  deleteTask,
  updateTask,
} from "@/actions/tasks/tasks";
import type { CreateTask } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const { searchParams } = _request.nextUrl;
    const employeeId = Number(searchParams.get("employeeId"));
    const role = searchParams.get("role");
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }
    let task: CreateTask | undefined;
    if (role === "manager") {
      task = await getTaskByManager(employeeId, id);
    } else {
      task = await getTaskForEmployee(employeeId, id);
    }
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const { searchParams } = _request.nextUrl;
    const employeeId = Number(searchParams.get("employeeId"));
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }
    const deleted = await deleteTask(employeeId, id);

    if (!deleted.success) {
      return NextResponse.json(
        { error: deleted.error?.reason || "Task not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: deleted.success.reason });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const pid = (await params).id;
    const id = Number(pid);
    const body = await request.json();
    const content: Partial<CreateTask> = {};
    const keys = Object.keys(body) as Array<keyof CreateTask>;
    for (const key of keys) {
      const value = body[key];
      if (value !== undefined) {
        (content as Record<string, unknown>)[key as string] = value as unknown;
      }
    }
    const { searchParams } = request.nextUrl;
    const employeeId = Number(searchParams.get("employeeId"));
    const role = searchParams.get("role");
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }
    const updated = await updateTask(employeeId, id, content);
    if (!updated.success) {
      return NextResponse.json(
        { error: updated.error?.reason || "Task not found or not updated" },
        { status: 404 },
      );
    }

    // Fetch and return the updated task object so clients can update instantly
    let task: CreateTask | undefined;
    if (role === "manager") {
      task = await getTaskByManager(employeeId, id);
    } else if (role === "employee") {
      task = await getTaskForEmployee(employeeId, id);
    } else {
      // Fallback: return 200 with no task if role missing
      return NextResponse.json({ message: updated.success.reason });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
