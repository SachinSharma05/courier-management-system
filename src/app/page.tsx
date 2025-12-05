export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "@/app/lib/auth/getServerSession";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session.ok) redirect("/auth/login");

  if (session.user.role === "super_admin") redirect("/admin");

  redirect("/client");
}
