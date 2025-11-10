/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function EmployeeProfileView({ employee }: { employee: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={employee.hoto || ""} alt={employee.name} />
          <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold">{employee.name}</h2>
          <p className="text-sm text-muted-foreground">
            {employee.role} • {employee.department}
          </p>
          <Badge>{employee.employmentType || "N/A"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 ">
        <p>
          <strong>Email:</strong> {employee.email}
        </p>
        <p>
          <strong>Phone:</strong> {employee.phone || "-"}
        </p>
        <p>
          <strong>Staff No.:</strong> {employee.staffNumber}
        </p>
        <p>
          <strong>Date of Birth:</strong> {employee.dateOfBirth || "-"}
        </p>
        <p>
          <strong>Marital Status:</strong> {employee.maritalStatus || "-"}
        </p>
        <p>
          <strong>Address:</strong> {employee.address || "-"}
        </p>
      </div>
    </div>
  );
}
