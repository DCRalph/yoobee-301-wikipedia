import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { PublicArticleForm } from "~/components/wiki/public-article-form";

export const metadata = {
  title: "Create Article | Wiki",
  description: "Create a new article in the wiki",
};

export default function CreateArticlePage() {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Article
        </h1>
        <p className="text-muted-foreground">
          Share your knowledge by creating a new article.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <PublicArticleForm />
      </Suspense>
    </div>
  );
}
