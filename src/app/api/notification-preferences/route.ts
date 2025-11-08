import { db } from "@/db";
import { notification_preferences } from "@/db/schema/notification-preferences";
import { getUser } from "@/actions/auth/dal";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user)
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );

  const prefs = await db
    .select()
    .from(notification_preferences)
    .where(eq(notification_preferences.user_id, user.id));

  return NextResponse.json({ success: true, data: prefs[0] });
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );

    const body = await req.json();
    console.log("trying to save user prefernces", body, user.id, {
      ...body,
      user_id: user.id,
    });
    const existingPref = await db.query.notification_preferences.findFirst({
      where: eq(notification_preferences.user_id, user.id),
    });

    if (existingPref) {
      await db
        .update(notification_preferences)
        .set({ ...body, user_id: user.id, notify_on_message: true })
        .where(eq(notification_preferences.user_id, user.id));
    } else {
      await db.insert(notification_preferences).values({
        ...body,
        user_id: user.id,
        notify_on_message: true,
      });
    }

    return NextResponse.json({ success: true, message: "Preferences updated" });
  } catch (error) {
    console.log(error, "error saving preferences");
    return {
      success: null,
      error: true,
    };
  }
}
