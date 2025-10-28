import { getUser } from "@/actions/auth/dal";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const employee = await getUser();

  if (!employee || !employee.isManager) {
    redirect("/unauthorized");
  }
  return <section>{children}</section>;
}
