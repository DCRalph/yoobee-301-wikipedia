import { type Metadata } from "next";
import { RevisionDetailContent } from "./revision-detail-content";
import { api } from "~/trpc/server";
import { notFound } from "next/navigation";

interface RevisionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: RevisionDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const revision = await api.admin.revisions.getRevisionById({
      revisionId: id,
    });

    return {
      title: `Revision for ${revision.article.title} - Admin`,
      description: `Review revision made by ${revision.editor.name}`,
    };
  } catch {
    return {
      title: "Revision Not Found",
      description: "The requested revision could not be found",
    };
  }
}

export default async function RevisionDetailPage({
  params,
}: RevisionDetailPageProps) {
  const { id } = await params;

  try {
    const revision = await api.admin.revisions.getRevisionById({
      revisionId: id,
    });

    return <RevisionDetailContent revision={revision} />;
  } catch {
    notFound();
  }
} 