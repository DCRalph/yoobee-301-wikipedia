import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { RevisionContent } from "./revision-content";
import { useSession } from "next-auth/react";
import React from "react";

interface PageProps {
  slug: string;
  revisionId: string;
}

export default async function RevisionPage({ params }: { params: Promise<PageProps> }) {
  const { slug, revisionId } = await params;
  try {
    const revision = await api.articles.getRevisionById({
      revisionId: revisionId,
    });

    // Make sure the revision belongs to the correct article
    if (revision.article.slug !== slug) {
      return notFound();
    }

    return <RevisionContent revision={revision} />;
  } catch (error) {
    return notFound();
  }
} 