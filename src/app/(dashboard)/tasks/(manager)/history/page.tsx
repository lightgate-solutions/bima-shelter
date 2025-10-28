import { TasksCard } from "@/components/tasks/task-cards";
import { TasksTable } from "@/components/tasks/task-table";
import React from "react";

const HistoryPage = async () => {
  return (
    <div className="p-2">
      <div className="mb-4">
        <TasksCard />
      </div>
      <TasksTable />
    </div>
  );
};

export default HistoryPage;
