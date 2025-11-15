import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listEmployees } from "@/actions/hr/employees";

export async function GET(request: Request) {
  try {
    // Admin-only access (same pattern as tasks API)
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Query parameters
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const q = url.searchParams.get("q") ?? undefined;

    // Cursor for pagination
    let cursor: { createdAt: string; id: number } | null = null;
    const c = url.searchParams.get("cursor");
    if (c) {
      try {
        cursor = JSON.parse(c);
      } catch {
        cursor = null;
      }
    }

    // Optimized server fetch (cursor-based pagination + search)
    const data = await listEmployees({
      limit,
      cursor,
      q,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in /api/hr/employees/all:", error);

    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
