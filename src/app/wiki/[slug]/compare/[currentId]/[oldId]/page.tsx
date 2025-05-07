import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { CompareContent } from "./compare-content";

interface PageProps {
  slug: string;
  currentId: string;
  oldId: string;
}

export default async function ComparePage({ params }: { params: Promise<PageProps> }) {
  const { slug, currentId, oldId } = await params;
  try {
    const comparison = await api.articles.compareRevisions({
      currentRevisionId: currentId,
      oldRevisionId: oldId,
    });

    // Make sure the revisions belong to the correct article
    if (comparison.article.slug !== slug) {
      return notFound();
    }

    return <CompareContent comparison={comparison} />;
  } catch {
    return notFound();
  }
} 