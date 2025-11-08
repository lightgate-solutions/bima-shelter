import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/actions/auth/dal";

export async function GET() {
  const user = await getUser();
  console.log("in unread count func");
  if (!user) return Response.json({ success: false, count: 0 });

  const count = await db.$count(
    notifications,
    and(eq(notifications.user_id, user.id), eq(notifications.is_read, false)),
  );

  return Response.json({ success: true, count });
}
