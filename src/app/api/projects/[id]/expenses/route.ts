import { db } from "@/db";
import { expenses } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    const rows = await db
      .select()
      .from(expenses)
      .where(eq(expenses.projectId, projectId));
    return NextResponse.json({ expenses: rows });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    const body = await request.json();
    const { title, amount, spentAt, notes } = body ?? {};
    if (!title)
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    const [created] = await db
      .insert(expenses)
      .values({
        projectId,
        title,
        amount: Number(amount) || 0,
        spentAt: spentAt ? new Date(spentAt) : null,
        notes,
      })
      .returning();
    return NextResponse.json({ expense: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    const body = await request.json();
    const { id: expenseId, title, amount, spentAt, notes } = body ?? {};
    if (!expenseId)
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    const [updated] = await db
      .update(expenses)
      .set({
        title,
        amount: amount !== undefined ? Number(amount) : undefined,
        spentAt: spentAt ? new Date(spentAt) : null,
        notes,
      })
      .where(
        and(
          eq(expenses.projectId, projectId),
          eq(expenses.id, Number(expenseId)),
        ),
      )
      .returning();
    return NextResponse.json({ expense: updated });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    const body = await request.json();
    const { id: expenseId } = body ?? {};
    if (!expenseId)
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.projectId, projectId),
          eq(expenses.id, Number(expenseId)),
        ),
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 },
    );
  }
}
