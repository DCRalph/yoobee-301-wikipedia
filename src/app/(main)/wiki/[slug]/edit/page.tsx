import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { EditArticleContent } from "./edit-article-content";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) {
    return notFound();
  }

  const article = await db.article.findUnique({
    where: {
      slug,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          editor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!article) {
    return notFound();
  }

  return <EditArticleContent article={article} />;
}
