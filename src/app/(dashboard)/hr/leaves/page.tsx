import LeavesTable from "@/components/hr/leaves-table";
import { BackButton } from "@/components/ui/back-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/auth/login");
  }

  // Get employee info to check department
  const [employee] = await db
    .select({
      role: employees.role,
      department: employees.department,
    })
    .from(employees)
    .where(eq(employees.authId, session.user.id))
    .limit(1);

  const isAdmin = session.user.role === "admin";
  const isAdminDept = employee?.department?.toLowerCase() === "admin";
  const isHr =
    employee?.department?.toLowerCase() === "hr" ||
    employee?.department?.toLowerCase() === "human resources" ||
    employee?.role?.toLowerCase() === "hr";

  // Only admin (role or department) and HR can access this page
  if (!isAdmin && !isAdminDept && !isHr) {
    return redirect("/unauthorized");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Leave Management</h1>
            <p className="text-sm text-muted-foreground">
              View and manage employee leave applications
            </p>
          </div>
        </div>
      </div>
      <LeavesTable showFilters={true} />
    </div>
  );
}
