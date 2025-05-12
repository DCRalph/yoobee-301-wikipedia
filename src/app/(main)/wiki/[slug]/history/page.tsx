import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { ArticleHistoryContent } from "./article-history-content";

interface ArticleHistoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticleHistoryPageProps) {
  const { slug } = await params;
  try {
    const article = await api.user.articles.getBySlug({ slug });
    return {
      title: `${article.title} - Revision History | WikiClone`,
      description: `View the complete revision history for ${article.title}.`,
    };
  } catch {
    return {
      title: "Article History | WikiClone",
      description: "Article revision history not found.",
    };
  }
}

export default async function ArticleHistoryPage({
  params,
}: ArticleHistoryPageProps) {
  try {
    // Fetch the article with all its revisions
    const { slug } = await params;
    const article = await api.user.articles.getBySlug({ slug });

    // If the article is not published, show 404 unless we're implementing a special permission check
    if (!article.published) {
      return notFound();
    }

    return <ArticleHistoryContent article={article} />;
  } catch {
    return notFound();
  }
}
