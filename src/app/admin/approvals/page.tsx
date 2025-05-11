import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Role } from "@prisma/client";
import { ApprovalsContent } from "./approvals-content";

export const metadata = {
  title: "Approvals | Admin Dashboard",
  description: "Review and approve pending articles and revisions",
};

export default async function ApprovalsPage() {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/");
  }

  return <ApprovalsContent />;
} 