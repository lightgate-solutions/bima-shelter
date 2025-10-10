"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createUser } from "@/actions/auth/auth";
import { toast } from "sonner";
import { getManagers } from "@/actions/auth/users";
import { Switch } from "@/components/ui/switch";

interface UserAddDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccess?: () => void;
}

export function UserAddDialog({
  isOpen,
  onCloseAction,
  onSuccess,
}: UserAddDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
    autoVerify: true,
    isManager: false,
  });

  const [employeeData, setEmployeeData] = useState({
    phone: "",
    staffNumber: "",
    department: "",
    managerId: "" as string,
    dateOfBirth: null as Date | null,
    address: "",
    maritalStatus: "Single" as "Single" | "Married" | "Divorced" | "Widowed",
    employmentType: "Full-time" as
      | "Full-time"
      | "Part-time"
      | "Contract"
      | "Intern",
  });

  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await getManagers();
        if (res.success) {
          const data = res.data;
          setManagers(data ?? []);
        } else {
          toast.error(res.error.reason);
        }
      } catch (_e) {
        toast.error("Unexpected error. Please try again");
      }
    })();
  }, [isOpen]);

  const handleCreateUser = async () => {
    setIsLoading(true);
    const res = await createUser({
      ...formData,
      data: {
        phone: employeeData.phone || undefined,
        staffNumber: employeeData.staffNumber || undefined,
        department: employeeData.department || undefined,
        managerId: employeeData.managerId || undefined,
        dateOfBirth: employeeData.dateOfBirth || undefined,
        address: employeeData.address || undefined,
        maritalStatus: employeeData.maritalStatus || undefined,
        employmentType: employeeData.employmentType || undefined,
      },
    });
    if (res.error) {
      toast.error(res.error.reason);
    } else {
      toast.success(
        formData.autoVerify
          ? "User created and verified successfully"
          : "User created successfully. Verification email sent.",
      );
      onSuccess?.();
      onCloseAction();
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        autoVerify: false,
        isManager: false,
      });
      setEmployeeData({
        phone: "",
        staffNumber: "",
        department: "",
        managerId: "",
        dateOfBirth: null,
        address: "",
        maritalStatus: "Single",
        employmentType: "Full-time",
      });
    }
    setIsLoading(false);
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onCloseAction={onCloseAction}
      onConfirmAction={handleCreateUser}
      title="Add New User"
      description="Create a new user account with the following details."
      confirmText={isLoading ? "Creating..." : "Create User"}
    >
      <div className="grid gap-4 grid-cols-2 py-4">
        {/* Account fields */}
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter user's name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter user's email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Enter user's password"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value: "admin" | "user") =>
              setFormData((prev) => ({ ...prev, role: value }))
            }
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="isManager" className="cursor-pointer">
            Is user a manager?
          </Label>
          <Switch
            id="isManager"
            checked={formData.isManager}
            onCheckedChange={(checked: boolean) =>
              setFormData((prev) => ({ ...prev, isManager: checked }))
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="staffNumber">Staff ID Number</Label>
          <Input
            id="staffNumber"
            value={employeeData.staffNumber}
            onChange={(e) =>
              setEmployeeData((prev) => ({
                ...prev,
                staffNumber: e.target.value,
              }))
            }
            placeholder="Enter staff id number"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={employeeData.phone}
            onChange={(e) =>
              setEmployeeData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="Enter phone number"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={employeeData.department}
            onChange={(e) =>
              setEmployeeData((prev) => ({
                ...prev,
                department: e.target.value,
              }))
            }
            placeholder="Enter department"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="managerId">Manager</Label>
          <Select
            value={employeeData.managerId}
            onValueChange={(value: string) =>
              setEmployeeData((prev) => ({ ...prev, managerId: value }))
            }
          >
            <SelectTrigger id="managerId" className="w-full">
              <SelectValue placeholder="Select employee's manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !employeeData.dateOfBirth && "text-muted-foreground",
                )}
              >
                {employeeData.dateOfBirth ? (
                  new Date(employeeData.dateOfBirth).toLocaleDateString()
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={employeeData.dateOfBirth ?? undefined}
                onSelect={(d) =>
                  setEmployeeData((p) => ({ ...p, dateOfBirth: d ?? null }))
                }
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select
            value={employeeData.maritalStatus}
            onValueChange={(
              value: "Married" | "Single" | "Divorced" | "Widowed",
            ) => setEmployeeData((prev) => ({ ...prev, maritalStatus: value }))}
          >
            <SelectTrigger id="maritalStatus" className="w-full">
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Married">Married</SelectItem>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Divorced">Divorced</SelectItem>
              <SelectItem value="Widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="employmentType">Employment Type</Label>
          <Select
            value={employeeData.employmentType}
            onValueChange={(
              value: "Full-time" | "Part-time" | "Contract" | "Intern",
            ) =>
              setEmployeeData((prev) => ({ ...prev, employmentType: value }))
            }
          >
            <SelectTrigger id="employmentType" className="w-full">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Full-time">Full-Time</SelectItem>
              <SelectItem value="Part-time">Part-Time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Intern">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            rows={3}
            value={employeeData.address}
            onChange={(e) =>
              setEmployeeData((prev) => ({ ...prev, address: e.target.value }))
            }
            placeholder="Enter full address"
          />
        </div>
      </div>
    </ConfirmationDialog>
  );
}
