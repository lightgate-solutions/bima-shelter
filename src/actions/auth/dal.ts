"use server";
import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user.id) {
    redirect("/auth/login");
  }

  return { isAuth: true, userId: session.user.id, role: session.user.role };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session.userId) return null;

  const [user] = await db
    .select({
      id: employees.id,
      name: employees.name,
      staffNumber: employees.staffNumber,
      role: employees.role,
      email: employees.email,
      phone: employees.phone,
      department: employees.department,
      managerId: employees.managerId,
      isManager: employees.isManager,
    })
    .from(employees)
    .where(eq(employees.authId, session.userId))
    .limit(1);

  return user;
});
