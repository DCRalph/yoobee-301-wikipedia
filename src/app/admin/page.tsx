import { Suspense } from "react";
import { AdminDashboardContent } from "~/components/admin/admin-dashboard-content";
import { Skeleton } from "~/components/ui/skeleton";

export const metadata = {
  title: "Admin Dashboard | Modern Wikipedia Clone",
  description: "Administration dashboard for your Wikipedia clone",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Wikipedia clone.
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-3 h-6 w-full" />
        </div>
      ))}
    </div>
  );
}
