import { UserManagementContent } from "./user-management-content";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export const metadata = {
  title: "User Management | Admin Dashboard",
  description: "Manage users in your Wikipedia clone",
};

export default async function UsersPage() {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/");
  }

  return <UserManagementContent />;
}
