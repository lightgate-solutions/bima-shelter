import { AdminTasksTable } from "@/components/tasks/admin-tasks-table";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "All Tasks • Admin",
};

// Ensure this segment is always resolved at runtime
export const dynamic = "force-dynamic";

export default function AdminTasksPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">All Tasks</h1>
            <p className="text-sm text-muted-foreground">
              View and manage all tasks across the organization
            </p>
          </div>
        </div>
      </div>
      <AdminTasksTable />
    </div>
  );
}
