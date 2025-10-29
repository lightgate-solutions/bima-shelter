import { TasksTable } from "@/components/tasks/task-table";

export default function ManagerTasksPage() {
  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold mb-2">Task Item</h2>
      <p className="text-sm text-muted-foreground mb-4">
        View, create, and manage tasks across your team. Open a task to chat,
        review progress, and make updates.
      </p>
      <TasksTable />
    </div>
  );
}
