import { notFound, redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Role } from "@prisma/client";
import { AdminNav } from "~/components/admin/admin-nav";
import { Header } from "~/components/layout/header";

export const metadata = {
  title: "Admin Dashboard | Modern Wikipedia Clone",
  description: "Admin dashboard for managing the Wikipedia clone",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Check if user has admin role
  if (session.user.role !== Role.ADMIN) {
    return notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Admin Navigation */}
      <Header />
      <AdminNav />

      {/* Main content area */}
      <main className="relative w-full">{children}</main>
    </div>
  );
}
