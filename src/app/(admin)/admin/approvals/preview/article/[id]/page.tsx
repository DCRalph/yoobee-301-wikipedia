import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { PreviewPendingArticleContent } from "./preview-content";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PreviewPendingArticlePage({ params }: PageProps) {
  const { id } = await params;
  try {
    const article = await api.admin.articles.previewPendingArticle({
      id,
    });

    return <PreviewPendingArticleContent article={article} />;
  } catch {
    return notFound();
  }
}
