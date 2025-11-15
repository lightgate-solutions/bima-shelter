import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSalaryStructure } from "@/actions/payroll/salary-structure";
import { formatCurrency } from "@/lib/utils";

export default async function StructureDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const structure = await getSalaryStructure(parseInt(params.id, 10));

  if (!structure) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Structure Not Found</h1>
          <Link href="/payroll/structure">
            <Button>Back to Structures</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              The requested salary structure could not be found. It may have
              been deleted or the ID is incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{structure.name}</h1>
        <Link href="/payroll/structure">
          <Button variant="outline">Back to Structures</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Structure Details</CardTitle>
          <CardDescription>
            Basic information about this salary structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Base Salary
              </h3>
              <p className="text-xl font-semibold">
                {formatCurrency(Number(structure.baseSalary))}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h3>
              <p className="text-xl font-semibold">
                {structure.active ? "Active" : "Inactive"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Created By
              </h3>
              <p className="text-xl font-semibold">{structure.createdBy}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Last Updated
              </h3>
              <p className="text-xl font-semibold">
                {new Date(structure.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Description
            </h3>
            <p className="text-base">{structure.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Employees</CardTitle>
          <CardDescription>
            Employees currently using this salary structure (
            {structure.employeeCount})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            {structure.employeeCount > 0
              ? "This feature will be implemented in the future. Currently, there are " +
                structure.employeeCount +
                " employees using this salary structure."
              : "No employees are currently using this salary structure."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
