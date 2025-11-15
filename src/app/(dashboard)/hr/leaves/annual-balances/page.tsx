import AnnualLeaveBalancesTable from "@/components/hr/annual-leave-balances-table";
import { BackButton } from "@/components/ui/back-button";

export default async function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Annual Leave Balances</h1>
            <p className="text-sm text-muted-foreground">
              Manage annual leave allocations for employees
            </p>
          </div>
        </div>
      </div>
      <AnnualLeaveBalancesTable />
    </div>
  );
}
