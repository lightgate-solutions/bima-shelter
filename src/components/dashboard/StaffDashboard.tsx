"use client";

import { DashboardStats } from "./dashboard-stats";

export default function StaffDashboard() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Welcome back! Here's an overview of your work and activities.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats userRole="staff" isManager={false} />
    </div>
  );
}
