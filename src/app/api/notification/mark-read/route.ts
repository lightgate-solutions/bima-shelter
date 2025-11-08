import { NextResponse } from "next/server";
import { markNotificationsAsRead } from "@/actions/notification/notification";

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!ids?.length) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    await markNotificationsAsRead(ids);

    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notifications as read" },
      { status: 500 },
    );
  }
}
