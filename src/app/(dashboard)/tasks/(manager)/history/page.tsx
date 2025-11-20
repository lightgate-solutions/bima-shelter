import { TasksCard } from "@/components/tasks/task-cards";
import { TasksTable } from "@/components/tasks/task-table";
import { BackButton } from "@/components/ui/back-button";

const HistoryPage = async () => {
  return (
    <div className="p-2 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Task History</h1>
            <p className="text-sm text-muted-foreground">
              View completed and past tasks
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
};

export default HistoryPage;
