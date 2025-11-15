/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Edit, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";
import AnnualLeaveSettingsDialog from "./annual-leave-settings-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function AnnualLeaveBalancesTable() {
  const [selectedSetting, setSelectedSetting] = useState<any | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryClient = useQueryClient();

  // Fetch global annual leave settings
  const { data: settings = [] } = useQuery({
    queryKey: ["annual-leave-settings"],
    queryFn: async () => {
      const response = await fetch("/api/hr/leaves/annual-settings");
      const data = await response.json();
      return data.settings || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["annual-leave-balances", page],
    queryFn: async () => {
      const response = await fetch(
        `/api/hr/leaves/balances/annual?page=${page}&limit=${limit}`,
      );
      const data = await response.json();
      return data;
    },
  });

  const balances = data?.balances || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading annual leave balances...
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Global Annual Leave Settings */}
      <Card className="p-4 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Annual Leave Settings</CardTitle>
              <CardDescription>
                Set the global annual leave allocation for all employees
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedSetting(null);
                setShowSettingsDialog(true);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Set Annual Leave Allocation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No annual leave settings configured. Click the button above to set
              the allocation.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Allocated Days</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting: any) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">
                      {setting.year}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {setting.allocatedDays} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {setting.description || (
                        <span className="text-muted-foreground">
                          No description
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSetting(setting);
                            setShowSettingsDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Are you sure you want to delete this annual leave setting?",
                              )
                            ) {
                              return;
                            }

                            try {
                              const response = await fetch(
                                `/api/hr/leaves/annual-settings/${setting.id}`,
                                {
                                  method: "DELETE",
                                },
                              );

                              if (!response.ok) {
                                toast.error(
                                  "Failed to delete annual leave setting",
                                );
                                return;
                              }

                              toast.success(
                                "Annual leave setting deleted successfully",
                              );
                              queryClient.invalidateQueries({
                                queryKey: ["annual-leave-settings"],
                              });
                              queryClient.invalidateQueries({
                                queryKey: ["annual-leave-balances"],
                              });
                            } catch (_error) {
                              toast.error(
                                "An error occurred. Please try again.",
                              );
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Employee Balances */}
      <Card className="p-4 shadow-sm">
        <CardHeader>
          <div>
            <CardTitle className="text-xl">
              Employee Annual Leave Balances
            </CardTitle>
            <CardDescription>
              View annual leave balances for all employees
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No annual leave balances found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Total Days</TableHead>
                    <TableHead>Used Days</TableHead>
                    <TableHead>Remaining Days</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance: any) => (
                    <TableRow key={balance.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{balance.employeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {balance.employeeEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{balance.year}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {balance.totalDays} days
                        </Badge>
                      </TableCell>
                      <TableCell>{balance.usedDays} days</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            balance.remainingDays < 0
                              ? "bg-red-500"
                              : balance.remainingDays < 5
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }
                        >
                          {balance.remainingDays} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          Auto-calculated
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1 ? "pointer-events-none opacity-50" : ""
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            (p >= page - 1 && p <= page + 1),
                        )
                        .map((p, idx, arr) => (
                          <div key={p} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <PaginationItem>
                                <span className="px-2">...</span>
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setPage(p)}
                                isActive={p === page}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          </div>
                        ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSetting
                ? "Edit Annual Leave Allocation"
                : "Set Annual Leave Allocation"}
            </DialogTitle>
            <DialogDescription>
              {selectedSetting
                ? "Update the global annual leave allocation for this year"
                : "Set the global annual leave allocation that applies to all employees for a specific year"}
            </DialogDescription>
          </DialogHeader>
          <AnnualLeaveSettingsDialog
            setting={selectedSetting}
            onSuccess={() => {
              setShowSettingsDialog(false);
              setSelectedSetting(null);
              queryClient.invalidateQueries({
                queryKey: ["annual-leave-settings"],
              });
              queryClient.invalidateQueries({
                queryKey: ["annual-leave-balances"],
              });
            }}
            onCancel={() => {
              setShowSettingsDialog(false);
              setSelectedSetting(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
