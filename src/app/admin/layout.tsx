export const dynamic = "force-dynamic";

import { getServerSession } from "@/app/lib/auth/getServerSession";
import { redirect } from "next/navigation";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({ children }: { children : React.ReactNode }) {
  const session = await getServerSession();

  if (!session.ok) redirect("/auth/login");
  if (session.user.role !== "super_admin") redirect("/client");

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}