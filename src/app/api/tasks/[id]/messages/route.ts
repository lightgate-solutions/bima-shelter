import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  createTaskMessage,
  getMessagesForTaskSince,
  getRecentMessagesForTask,
} from "@/actions/tasks/taskMessages";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    if (!id)
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

    const searchParams = request.nextUrl.searchParams;
    const afterId = Number(searchParams.get("afterId") || "");
    const limit = Number(searchParams.get("limit") || "");

    const messages =
      afterId && Number.isFinite(afterId)
        ? await getMessagesForTaskSince(id, afterId)
        : limit && Number.isFinite(limit)
          ? await getRecentMessagesForTask(id, Math.max(1, limit))
          : await getRecentMessagesForTask(id, 50);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    if (!id)
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

    const body = await request.json();
    const content = String(body.content || "").trim();
    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 },
      );
    }

    // Derive sender from session
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    const authUserId = session?.user?.id;
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const emp = await db
      .select()
      .from(employees)
      .where(eq(employees.authId, authUserId))
      .limit(1)
      .then((r) => r[0]);
    if (!emp) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 403 },
      );
    }

    const res = await createTaskMessage({
      taskId: id,
      senderId: emp.id,
      content,
    });
    if (res.error) {
      return NextResponse.json({ error: res.error.reason }, { status: 400 });
    }
    return NextResponse.json({ message: "ok" });
  } catch (err) {
    console.error("Error posting message:", err);
    return NextResponse.json(
      { error: "Failed to post message" },
      { status: 500 },
    );
  }
}
