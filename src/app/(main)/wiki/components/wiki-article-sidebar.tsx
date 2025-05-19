import Image from "next/image"
import { Button } from "~/components/ui/button"
import { FileText, Share2, Star, Printer, ExternalLink } from "lucide-react"
import { formatDate } from "~/lib/date-utils"
import type { RouterOutputs } from "~/trpc/react"

interface WikiArticleSidebarProps {
  article: RouterOutputs["user"]["articles"]["getBySlug"]
}

export function WikiArticleSidebar({ article }: WikiArticleSidebarProps) {
  // Determine if this is a country article to show appropriate quick facts
  const isCountryArticle =
    article.title.includes("Zealand") || article.title.includes("Country") || article.content.includes("country")

  return (
    <div className="sticky top-6 rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-4 overflow-hidden rounded-lg">
        <Image
          src="/placeholder.svg?height=300&width=400"
          alt={article.title}
          width={400}
          height={300}
          className="h-auto w-full object-cover"
        />
        <p className="mt-2 text-xs text-gray-500">{article.title} - Representative image</p>
      </div>

      <div className="mb-4">
        <h3 className="mb-2 font-medium">Quick Facts</h3>
        <dl className="space-y-2 text-sm">
          {isCountryArticle ? (
            <>
              <div className="flex justify-between">
                <dt className="font-medium">Official Name:</dt>
                <dd>New Zealand / Aotearoa</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Population:</dt>
                <dd>5.1 million</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Capital:</dt>
                <dd>Wellington</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Largest City:</dt>
                <dd>Auckland</dd>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <dt className="font-medium">Created:</dt>
                <dd>{formatDate(new Date(article.createdAt))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Author:</dt>
                <dd>{article.author.name ?? "Anonymous"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Last Updated:</dt>
                <dd>{formatDate(new Date(article.updatedAt))}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <FileText className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Share2 className="mr-2 h-4 w-4" />
          Share Article
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Star className="mr-2 h-4 w-4" />
          Save to Favorites
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Printer className="mr-2 h-4 w-4" />
          Print Article
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <ExternalLink className="mr-2 h-4 w-4" />
          Cite This Article
        </Button>
      </div>
    </div>
  )
}
