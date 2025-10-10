import { UsersTable } from "@/components/hr/admin/users-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users | Admin Dashboard",
  description: "Manage users in the admin dashboard",
};

export default function UsersPage() {
  return (
    <div className="">
      <UsersTable />
    </div>
  );
}
