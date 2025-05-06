import { notFound, redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Role } from "@prisma/client";
import { AdminSidebar } from "~/components/admin/admin-sidebar";

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
    <div className="flex min-h-screen">
      {/* Admin Sidebar (both mobile and desktop versions handled within component) */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <div className="container px-4 py-6 md:px-6 md:py-8">{children}</div>
      </div>
    </div>
  );
}
