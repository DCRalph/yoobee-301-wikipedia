import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { UserManagementContent } from "~/components/admin/user-management-content";

export const metadata = {
  title: "User Management | Admin Dashboard",
  description: "Manage users in your Wikipedia clone",
};

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">View and manage user accounts.</p>
      </div>

      <Suspense fallback={<UserTableSkeleton />}>
        <UserManagementContent />
      </Suspense>
    </div>
  );
}

function UserTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <div className="h-12 border-b px-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 border-b p-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="ml-auto h-8 w-[100px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
