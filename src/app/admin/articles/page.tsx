import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { ArticleManagementContent } from "./article-management-content";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Article Management | Admin Dashboard",
  description: "Manage articles in your Wikipedia clone",
};

export default async function ArticlePage() {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/");
  }

  return (
    <ArticleManagementContent />
  );
}

