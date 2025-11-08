"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { User } from "@/types";
import TaskChat from "@/components/tasks/task-chat";

export function TaskChatDialog({
  taskId,
  user,
  trigger,
  title = "Task Chat",
}: {
  taskId: number;
  user: User | null;
  trigger: React.ReactNode;
  title?: string;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="truncate">{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <TaskChat taskId={taskId} user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
