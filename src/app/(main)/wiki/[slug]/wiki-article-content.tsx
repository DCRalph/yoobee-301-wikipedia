"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"
import { AlertCircle, Edit, Clock, User, Calendar, History, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Button } from "~/components/ui/button"
import { WikiArticleReadingLevel } from "../components/wiki-article-reading-level"
import { WikiArticleContents } from "../components/wiki-article"
import { formatDate, formatDistanceToNow } from "~/lib/date-utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AISummaryDialog } from "../components/AISummaryDialog"
import { useEffect, useState } from "react"
import type { RouterOutputs } from "~/trpc/react"

interface WikiArticleContentProps {
  article: RouterOutputs["user"]["articles"]["getBySlug"]
  UseAi: boolean
}

export function WikiArticleContent({ article, UseAi }: WikiArticleContentProps) {
  // Use client-side state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === Role.ADMIN
  const isModerator = session?.user?.role === Role.MODERATOR
  const canEdit = isAdmin || isModerator

  // Set isClient to true after component mounts to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Safely split content only on client side
  const contentParts = isClient ? article.content.split("\n\n") : [""]
  const firstParagraph = isClient ? contentParts[0] : ""
  const restContent = isClient ? contentParts.slice(1).join("\n\n") : ""

  return (
    <div className="min-h-screen bg-[#f5f0e6]">
      <div className="flex">
        {/* Left Sidebar - Full height, flush with left edge */}
        <aside className="w-64 shrink-0 h-screen sticky top-0 left-0">
          <WikiArticleContents />
        </aside>

        {/* Main Content Area with Image and Article */}
        <div className="flex-1">
          {/* AI Features Alert */}
          {isClient && !UseAi && (
            <div className="p-4">
              <div className="rounded-md bg-[#e8dcc3] p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-[#5c3c10]" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-[#3a2a14]">AI Features Disabled</h3>
                    <div className="mt-2 text-sm text-[#5c3c10]">
                      AI features are currently disabled because I&apos;m balling like that.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row">
            {/* Large Image on the Left */}
            <div className="md:w-80 md:sticky md:top-0 md:h-screen p-4">
              {!isClient ? (
                <div className="h-full bg-white"></div>
              ) : (
                <div className="h-full">
                  <div className="overflow-hidden">
                    <img
                      src="/placeholder.svg?height=800&width=600"
                      alt={article.title}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#605244]">{article.title} - Representative image</p>
                </div>
              )}
            </div>

            {/* Main Article Content */}
            <main className="flex-1 p-4">
              <div className="rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-6 shadow-sm">
                {/* Reading Level Slider */}
                <WikiArticleReadingLevel />

                {/* Article Tabs */}
                <Tabs defaultValue="article" className="mb-6">
                  <TabsList className="grid w-full grid-cols-3 bg-[#e8dcc3] text-[#5c3c10]">
                    <TabsTrigger
                      value="article"
                      className="data-[state=active]:bg-[#5c3c10] data-[state=active]:text-[#f9f5eb]"
                    >
                      Article
                    </TabsTrigger>
                    <TabsTrigger
                      value="talk"
                      className="data-[state=active]:bg-[#5c3c10] data-[state=active]:text-[#f9f5eb]"
                    >
                      Talk
                    </TabsTrigger>
                    <TabsTrigger
                      value="sources"
                      className="data-[state=active]:bg-[#5c3c10] data-[state=active]:text-[#f9f5eb]"
                    >
                      Sources
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="article">
                    {/* Article Title and Alerts */}
                    <div className="mb-6 border-b border-[#d4bc8b] pb-4">
                      <h1 className="text-3xl font-serif font-bold text-[#3a2a14] wiki-title">{article.title}</h1>
                      {isClient && article.title.includes("Zealand") && (
                        <p className="mt-2 text-[#5c3c10] italic">Aotearoa (Māori)</p>
                      )}
                    </div>

                    {/* Article Metadata */}
                    <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-[#5c3c10]">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{article.author.name ?? "Anonymous"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {isClient ? formatDate(new Date(article.createdAt)) : "..."}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Last updated {isClient ? formatDistanceToNow(new Date(article.updatedAt)) : "..."}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                        asChild
                      >
                        <Link href={`/wiki/${article.slug}/history`}>
                          <History className="mr-2 h-4 w-4" />
                          History
                        </Link>
                      </Button>
                    </div>

                    {/* Quick Facts */}
                    {isClient && (
                      <div className="mb-6 rounded-lg border border-[#d4bc8b] bg-white p-4">
                        <h3 className="mb-2 font-medium text-[#4b2e13]">Quick Facts</h3>
                        <dl className="space-y-2 text-sm">
                          {article.title.includes("Zealand") ? (
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
                                <dt className="font-medium text-[#4b2e13]">Born:</dt>
                                <dd className="text-[#605244]">August 26, 1918</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium text-[#4b2e13]">Died:</dt>
                                <dd className="text-[#605244]">February 24, 2020</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium text-[#4b2e13]">Nationality:</dt>
                                <dd className="text-[#605244]">American</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium text-[#4b2e13]">Field:</dt>
                                <dd className="text-[#605244]">Mathematics, Computer Science</dd>
                              </div>
                            </>
                          )}
                        </dl>
                      </div>
                    )}

                    {/* Article Content */}
                    <div className="mb-6">
                      <h2 className="mb-4 text-xl font-serif font-bold text-[#3a2a14] border-b border-[#d4bc8b] pb-2">
                        Overview
                      </h2>
                      <div className="prose max-w-none text-[#3a2a14]">
                        {isClient ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{firstParagraph}</ReactMarkdown>
                        ) : (
                          <p>Loading content...</p>
                        )}
                      </div>
                    </div>

                    {/* Rest of Article Content */}
                    <div className="prose max-w-none text-[#3a2a14]">
                      {isClient ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{restContent}</ReactMarkdown>
                      ) : (
                        <p>Loading content...</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {isClient && (
                      <div className="mt-8 mb-8 flex flex-wrap items-center gap-2">
                        {session?.user && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                              asChild
                            >
                              <Link href="/wiki/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Article
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                              asChild
                            >
                              <Link href={`/wiki/${article.slug}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Article
                              </Link>
                            </Button>
                          </>
                        )}
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                            asChild
                          >
                            <Link href={`/admin/articles/${article.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Admin Edit
                            </Link>
                          </Button>
                        )}
                        <AISummaryDialog articleId={article.id} />
                      </div>
                    )}

                    {/* Revision History */}
                    {isClient && article.revisions.length > 0 && (
                      <div className="mt-8 rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <History className="h-5 w-5 text-[#5c3c10]" />
                          <h3 className="font-serif font-bold text-[#3a2a14]">Revision History</h3>
                        </div>
                        <p className="mb-4 text-sm text-[#5c3c10]">
                          This article has been edited {article.revisions.length} times
                        </p>

                        <div className="space-y-4">
                          {article.revisions.slice(0, 5).map((revision) => (
                            <div
                              key={revision.id}
                              className="flex items-center justify-between border-b border-[#d4bc8b] pb-2 last:border-0"
                            >
                              <div>
                                <span className="font-medium text-[#3a2a14]">
                                  {revision.editor.name ?? "Anonymous"}
                                </span>
                                <span className="ml-2 text-sm text-[#5c3c10]">
                                  {formatDate(new Date(revision.createdAt))}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {article.revisions.length > 5 && (
                          <div className="mt-4 text-right">
                            <Button variant="link" className="px-0 text-[#5c3c10] hover:text-[#3a2a14]" asChild>
                              <Link href={`/wiki/${article.slug}/history`}>View all revisions</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="talk">
                    <div className="p-4 text-center text-[#5c3c10]">
                      <p>Discussion about this article goes here.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="sources">
                    <div className="p-4 text-center text-[#5c3c10]">
                      <p>Sources and references for this article go here.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 bg-[#3a2a14] p-4 text-center text-[#f9f5eb]">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#f9f5eb] flex items-center justify-center">
              <span className="text-[#3a2a14] font-serif font-bold">W</span>
            </div>
            <span className="font-serif">Wikipedia</span>
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="#" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="#" className="hover:underline">
              Policy Privacy
            </Link>
            <Link href="#" className="hover:underline">
              Contact Wikipedia
            </Link>
            <Link href="#" className="hover:underline">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
