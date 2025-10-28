import { getTasksForEmployee, getTasksByManager } from "@/actions/tasks/tasks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Task } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const userIdParam = searchParams.get("userId");
    if (!userIdParam || !role) {
      return NextResponse.json(
        { error: "Missing userId or role parameter" },
        { status: 400 },
      );
    }
    const userId = parseInt(userIdParam);
    let tasks: Task[];
    if (role === "employee") {
      tasks = await getTasksForEmployee(userId);
    } else if (role === "manager") {
      tasks = await getTasksByManager(userId);
    } else {
      return NextResponse.json(
        { error: "Invalid role parameter" },
        { status: 400 },
      );
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
