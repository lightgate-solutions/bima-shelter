import { NextResponse } from "next/server";
import { getUserNotifications } from "@/actions/notification/notification";

export async function GET() {
  try {
    const data = await getUserNotifications();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 },
    );
  }
}
