import { getLeaveBalance, setLeaveBalance } from "@/actions/hr/leaves";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam) : undefined;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    const balances = await getLeaveBalance(parseInt(employeeId), year);

    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave balances" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { employeeId, leaveType, totalDays, year } = body;

    if (!employeeId || !leaveType || totalDays === undefined || !year) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await setLeaveBalance({
      employeeId,
      leaveType,
      totalDays,
      year,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.reason }, { status: 400 });
    }

    return NextResponse.json({
      message: result.success?.reason,
      success: true,
    });
  } catch (error) {
    console.error("Error setting leave balance:", error);
    return NextResponse.json(
      { error: "Failed to set leave balance" },
      { status: 500 },
    );
  }
}
