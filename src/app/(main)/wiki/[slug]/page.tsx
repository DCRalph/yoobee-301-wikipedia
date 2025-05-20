import { notFound } from "next/navigation"
import { api } from "~/trpc/server"
import { WikiArticleContent } from "./wiki-article-content"
import { db } from "~/server/db"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  try {
    const { slug } = await params
    const article = await api.user.articles.getBySlug({ slug })
    return {
      title: `${article.title} | Modern Wikipedia Clone`,
      description: article.content.slice(0, 160),
    }
  } catch {
    return {
      title: "Article Not Found | Modern Wikipedia Clone",
      description: "The requested article could not be found.",
    }
  }
}

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  try {
    // Try to fetch the article by slug
    const article = await api.user.articles.getBySlug({ slug })

    let UseAi = false
    const setting = await db.setting.findFirst()

    if (setting?.enableAIFeatures) {
      UseAi = true
    }

    // If the article is not published and the user is not authenticated, show 404
    if (!article.published) {
      return notFound()
    }

    // No changes needed to page.tsx - just render the WikiArticleContent component
    return <WikiArticleContent article={article} UseAi={UseAi} />
  } catch {
    return notFound()
  }
}
