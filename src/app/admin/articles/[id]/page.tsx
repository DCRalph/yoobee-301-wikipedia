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
  } catch {
    return {
      title: "Edit Article | Admin Dashboard",
    };
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  // Handle new article creation
  const { id } = await params;
  return <ArticleForm id={id} />;
}
