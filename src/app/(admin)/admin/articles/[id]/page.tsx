import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { ArticleEditContent } from "./article-edit-content";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params;

  try {
    // Fetch the article using the admin API
    const article = await api.admin.articles.getById({ id });

    return <ArticleEditContent article={article} />;
  } catch {
    // If article not found or any other error, show 404
    return notFound();
  }
}
