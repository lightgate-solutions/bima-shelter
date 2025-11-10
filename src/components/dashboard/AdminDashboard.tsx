"use client";

import { DashboardStats } from "./dashboard-stats";
import { Users, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            System overview and administration panel.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats userRole="admin" isManager={true} />

      {/* Admin-specific Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="size-4 text-primary" />
              </div>
              User Management
            </CardTitle>
            <CardDescription className="text-sm">
              Manage users, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/hr/admin"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1.5 group/link"
            >
              Manage users
              <svg
                className="size-3 transition-transform group-hover/link:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/40 opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg">
              <div className="rounded-lg bg-primary/10 p-2">
                <Shield className="size-4 text-primary" />
              </div>
              System Settings
            </CardTitle>
            <CardDescription className="text-sm">
              Configure system-wide settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
