import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { SettingsForm } from "~/components/admin/settings-form";

export const metadata = {
  title: "Site Settings | Admin Dashboard",
  description: "Configure site-wide settings for your Wikipedia clone",
};

export default function SettingsPage() {
  return (
    <div className="space-y-8 mx-auto max-w-5xl p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground">
          Configure global settings for your Wikipedia clone.
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsForm />
      </Suspense>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
