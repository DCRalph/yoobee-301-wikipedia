import { AdminDashboardContent } from "./admin-dashboard-content";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "~/server/auth";

export const metadata = {
  title: "Admin Dashboard | Modern WikiClone",
  description: "Administration dashboard for your WikiClone",
};

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/");
  }

  return <AdminDashboardContent />;
}
