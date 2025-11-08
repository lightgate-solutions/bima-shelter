import { TasksTable } from "@/components/tasks/task-table";
import { TasksCard } from "@/components/tasks/task-cards";

export default function TodoPage() {
  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold mb-2">My Tasks</h2>
      <p className="text-sm text-muted-foreground mb-4">
        View and update the status of tasks assigned to you. You can chat with
        your manager and teammates and submit your work from the task view.
      </p>
      <div className="mb-4">
        <TasksCard />
      </div>
      <TasksTable />
    </div>
  );
}
