import LeavesTable from "@/components/hr/leaves-table";
import { BackButton } from "@/components/ui/back-button";

export default async function Page() {
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
