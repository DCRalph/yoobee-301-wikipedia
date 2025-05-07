import { Suspense } from "react";
import { WikiArticleList } from "~/components/wiki/wiki-article-list";
import { Skeleton } from "~/components/ui/skeleton";

export const metadata = {
  title: "Articles | Modern Wikipedia Clone",
  description: "Browse all articles in our Wiki",
};

export default function WikiIndexPage() {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All Articles</h1>
        <p className="text-muted-foreground">
          Browse all published articles in our Wiki.
        </p>
      </div>

      <Suspense fallback={<ArticleListSkeleton />}>
        <WikiArticleList />
      </Suspense>
    </div>
  );
}

function ArticleListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-2 rounded-lg border p-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
