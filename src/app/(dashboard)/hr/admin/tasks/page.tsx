import { AdminTasksTable } from "@/components/tasks/admin-tasks-table";

export const metadata = {
  title: "All Tasks • Admin",
};

export default function AdminTasksPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">All Tasks</h1>
      </div>
      <AdminTasksTable />
    </div>
  );
}
