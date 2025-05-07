import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { ArticleManagementContent } from "~/components/admin/article-management-content";

export const metadata = {
  title: "Article Management | Admin Dashboard",
  description: "Manage articles in your Wikipedia clone",
};

export default function ArticlesPage() {
  return (
    <div className="space-y-8 mx-auto max-w-5xl p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Article Management
        </h1>
        <p className="text-muted-foreground">
          Create, edit, and manage articles.
        </p>
      </div>

      <Suspense fallback={<ArticleTableSkeleton />}>
        <ArticleManagementContent />
      </Suspense>
    </div>
  );
}

function ArticleTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <div className="h-12 border-b px-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 border-b p-6">
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="ml-auto h-8 w-[100px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
