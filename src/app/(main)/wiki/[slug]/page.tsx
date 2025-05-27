import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { WikiArticleContent } from "./wiki-article-content";
import { db } from "~/server/db";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const article = await api.user.articles.getBySlug({ slug });
    return {
      title: `${article.title} | Modern Wikipedia Clone`,
      description: article.content.slice(0, 160),
    };
  } catch {
    return {
      title: "Article Not Found | Modern Wikipedia Clone",
      description: "The requested article could not be found.",
    };
  }
}

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    // Try to fetch the article by slug
    const article = await api.user.articles.getBySlug({ slug });

    let UseAi = false;
    const setting = await db.setting.findFirst();

    if (setting?.enableAIFeatures) {
      UseAi = true;
    }

    // If the article is not published and the user is not authenticated, show 404
    if (!article.published) {
      return notFound();
    }

    // Get client IP address from headers
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = (forwardedFor ?? realIp ?? "127.0.0.1").split(",")[0] ?? "";

    // Increment view count on the server side
    await db.articleView
      .findFirst({
        where: {
          ip,
          articleId: article.id,
          createdAt: {
            gt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          },
        },
      })
      .then(async (existingView) => {
        // If no existing view or view is older than 1 hour
        if (!existingView) {
          // Create or update the view record
          await db.articleView.upsert({
            where: {
              ip_articleId: {
                ip,
                articleId: article.id,
              },
            },
            create: {
              ip,
              articleId: article.id,
            },
            update: {
              createdAt: new Date(), // Reset timestamp
            },
          });

          // Check if daily views need to be reset
          const shouldResetDaily =
            new Date().getTime() - article.lastViewReset.getTime() >
            24 * 60 * 60 * 1000;

          // Update the view counts
          await db.article.update({
            where: { id: article.id },
            data: {
              viewCount: { increment: 1 },
              dailyViews: shouldResetDaily ? 1 : { increment: 1 },
              lastViewReset: shouldResetDaily ? new Date() : undefined,
            },
          });
        }
      });

    // No changes needed to page.tsx - just render the WikiArticleContent component
    return <WikiArticleContent article={article} UseAi={UseAi} />;
  } catch (error) {
    console.error("Error loading article:", error);
    return notFound();
  }
}
