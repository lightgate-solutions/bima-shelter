import { TasksTable } from "@/components/tasks/task-table";
import { TasksCard } from "@/components/tasks/task-cards";
import { BackButton } from "@/components/ui/back-button";

export default function TodoPage() {
  return (
    <div className="p-2 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <BackButton />
          <div>
            <h2 className="text-2xl font-bold mb-2">My Tasks</h2>
            <p className="text-sm text-muted-foreground">
              View and update the status of tasks assigned to you. You can chat
              with your manager and teammates and submit your work from the task
              view.
            </p>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <TasksCard />
      </div>
      <TasksTable />
    </div>
  );
}
