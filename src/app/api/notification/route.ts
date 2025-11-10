import { NextResponse } from "next/server";
import { getUserNotifications } from "@/actions/notification/notification";

export async function GET() {
  try {
    const result = await getUserNotifications();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 },
    );
  }
}
