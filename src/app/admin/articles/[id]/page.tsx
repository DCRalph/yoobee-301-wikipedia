import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { ArticleForm } from "~/components/admin/article-form";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { id } = await params;
  // Don't fetch if we're creating a new article
  if (id === "new") {
    return {
      title: "Create New Article | Admin Dashboard",
    };
  }

  try {
    const article = await api.articles.getById({ id });
    return {
      title: `Edit ${article.title} | Admin Dashboard`,
    };
  } catch (error) {
    return {
      title: "Edit Article | Admin Dashboard",
    };
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  // Handle new article creation
  const { id } = await params;
  if (id === "new") {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Article
          </h1>
          <p className="text-muted-foreground">
            Create a new article for your Wikipedia clone.
          </p>
        </div>

        <div>
          <ArticleForm />
        </div>
      </div>
    );
  }

  // Fetch the existing article for editing
  try {
    const { id } = await params;
    const article = await api.articles.getById({ id });

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Article</h1>
          <p className="text-muted-foreground">
            Edit &quot;{article.title}&quot; article.
          </p>
        </div>

        <div>
          <ArticleForm article={article} />
        </div>
      </div>
    );
  } catch (error) {
    return notFound();
  }
}
