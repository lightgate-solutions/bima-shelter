/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import EmployeeEditForm from "./employee-edit-dialog";
import EmployeeProfileView from "./employee-profile-dialog";
import { Edit, Eye } from "lucide-react";
import { getAllEmployees } from "@/actions/hr/employees";

export default function EmployeesTable() {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["get-all-employees"],
    queryFn: () => getAllEmployees(),
  });

  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | null>(null);

  if (employees.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No employees found.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading employees...
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No employees found.
      </div>
    );
  }

  return (
    <section>
      <Card className="p-4 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Employees</CardTitle>
          <CardDescription>
            All registered employees of bima shelters management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Employment Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={``} alt={employee.name} />
                      <AvatarFallback>
                        {employee.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.dateOfBirth}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {" "}
                        {employee.staffNumber}
                      </p>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <Badge variant="outline">{employee.role}</Badge>
                  </TableCell>

                  {/* Department */}
                  <TableCell>{employee.department || "-"}</TableCell>

                  {/* Email */}
                  <TableCell>{employee.email}</TableCell>

                  {/* Phone */}
                  <TableCell>{employee.phone || "-"}</TableCell>

                  {/* Employment Type */}
                  <TableCell>
                    <Badge>{employee.employmentType || "N/A"}</Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className=" flex text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setMode("view");
                      }}
                    >
                      <Eye />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setMode("edit");
                      }}
                    >
                      <Edit />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedEmployee && !!mode}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEmployee(null);
            setMode(null);
          }
        }}
      >
        <DialogContent className="min-w-[45rem] h-[32rem] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "view" ? "Employee Profile" : "Edit Employee"}
            </DialogTitle>
            <DialogDescription>
              {mode === "view"
                ? "Detailed employee information"
                : "Update employee details"}
            </DialogDescription>
          </DialogHeader>

          {mode === "view" && selectedEmployee && (
            <EmployeeProfileView employee={selectedEmployee} />
          )}

          {mode === "edit" && selectedEmployee && (
            <EmployeeEditForm
              employee={selectedEmployee}
              onCloseAction={() => {
                setSelectedEmployee(null);
                setMode(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
