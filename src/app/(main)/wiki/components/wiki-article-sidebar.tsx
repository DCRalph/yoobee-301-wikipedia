import Image from "next/image"
import { Button } from "~/components/ui/button"
import { FileText, Share2, Star, Printer, ExternalLink } from "lucide-react"
import { formatDate } from "~/lib/date-utils"
import type { RouterOutputs } from "~/trpc/react"

interface WikiArticleSidebarProps {
  article: RouterOutputs["user"]["articles"]["getBySlug"]
  isClient?: boolean
}

export function WikiArticleSidebar({ article, isClient = true }: WikiArticleSidebarProps) {
  // Determine if this is a country article to show appropriate quick facts
  const isCountryArticle =
    isClient &&
    (article.title.includes("Zealand") || article.title.includes("Country") || article.content.includes("country"))

  return (
    <div className="sticky top-4 rounded-lg border border-[#e5d3b3] bg-white p-4 shadow-sm">
      <div className="mb-4 overflow-hidden rounded-lg">
        <Image
          src="/placeholder.svg?height=300&width=400"
          alt={article.title}
          width={400}
          height={300}
          className="h-auto w-full object-cover"
        />
        <p className="mt-2 text-xs text-[#605244]">{article.title} - Representative image</p>
      </div>

      <div className="mb-4">
        <h3 className="mb-2 font-medium text-[#4b2e13]">Quick Facts</h3>
        <dl className="space-y-2 text-sm">
          {isClient && isCountryArticle ? (
            <>
              <div className="flex justify-between">
                <dt className="font-medium text-[#4b2e13]">Official Name:</dt>
                <dd className="text-[#605244]">New Zealand / Aotearoa</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-[#4b2e13]">Population:</dt>
                <dd className="text-[#605244]">5.1 million</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-[#4b2e13]">Capital:</dt>
                <dd className="text-[#605244]">Wellington</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-[#4b2e13]">Largest City:</dt>
                <dd className="text-[#605244]">Auckland</dd>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <dt className="font-medium text-[#4b2e13]">Created:</dt>
                <dd className="text-[#605244]">{isClient ? formatDate(new Date(article.createdAt)) : "Loading..."}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-[#4b2e13]">Author:</dt>
                <dd className="text-[#605244]">{article.author.name ?? "Anonymous"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-[#4b2e13]">Last Updated:</dt>
                <dd className="text-[#605244]">{isClient ? formatDate(new Date(article.updatedAt)) : "Loading..."}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-[#e5d3b3] text-[#4b2e13] hover:bg-[#f3e0c4]"
        >
          <FileText className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-[#e5d3b3] text-[#4b2e13] hover:bg-[#f3e0c4]"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Article
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-[#e5d3b3] text-[#4b2e13] hover:bg-[#f3e0c4]"
        >
          <Star className="mr-2 h-4 w-4" />
          Save to Favorites
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-[#e5d3b3] text-[#4b2e13] hover:bg-[#f3e0c4]"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Article
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-[#e5d3b3] text-[#4b2e13] hover:bg-[#f3e0c4]"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Cite This Article
        </Button>
      </div>
    </div>
  )
}
