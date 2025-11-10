import EmployeesTable from "@/components/hr/employees-table";
import { BackButton } from "@/components/ui/back-button";

export default async function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Employees</h1>
            <p className="text-sm text-muted-foreground">
              Manage employee records and information
            </p>
          </div>
        </div>
      </div>
      <EmployeesTable />
    </div>
  );
}
