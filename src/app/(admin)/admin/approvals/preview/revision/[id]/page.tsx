import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { RevisionPreviewContent } from "./revision-preview-content";

export default async function RevisionPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user) {
    return notFound();
  }

  const revision = await db.revision.findUnique({
    where: {
      id,
    },
    include: {
      article: {
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
        },
      },
      editor: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!revision) {
    return notFound();
  }

  return <RevisionPreviewContent revision={revision} />;
}
