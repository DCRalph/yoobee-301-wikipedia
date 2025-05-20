"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import {
  AlertCircle,
  Edit,
  Clock,
  User,
  Calendar,
  History,
  Plus,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { WikiArticleReadingLevel } from "../components/wiki-article-reading-level";
import { WikiArticleContents } from "../components/wiki-article";
import { formatDate, formatDistanceToNow } from "~/lib/date-utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AISummaryDialog } from "../components/AISummaryDialog";
import { useEffect, useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import React from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";

interface WikiArticleContentProps {
  article: RouterOutputs["user"]["articles"]["getBySlug"];
  UseAi: boolean;
}

export function WikiArticleContent({
  article,
  UseAi,
}: WikiArticleContentProps) {
  // Use client-side state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isModerator = session?.user?.role === Role.MODERATOR;
  const canEdit = isAdmin || isModerator;

  // Extract headings from content for table of contents
  const [headings, setHeadings] = useState<
    Array<{ text: string; level: number; id: string }>
  >([]);

  // Set isClient to true after component mounts to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);

    // Extract headings from the content when component mounts
    if (article.content) {
      const extractedHeadings: Array<{
        text: string;
        level: number;
        id: string;
      }> = [];

      const lines = article.content.split("\n");
      const headingRegex = /^(#{1,6})\s+(.+)$/;

      for (const line of lines) {
        // Match heading patterns: #, ##, ###, etc.
        const match = headingRegex.exec(line);

        if (match && match.length >= 3) {
          const level = match[1]?.length ?? 1; // Number of # symbols indicates heading level
          const text = match[2]?.trim() ?? "";
          const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

          extractedHeadings.push({ text, level, id });
        }
      }

      setHeadings(extractedHeadings);
    }
  }, [article.content]);

  // Safely split content only on client side
  const contentParts = isClient ? article.content.split("\n\n") : [""];
  const firstParagraph = isClient ? contentParts[0] : "";
  const restContent = isClient ? contentParts.slice(1).join("\n\n") : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f0e6]">
      <div className="flex flex-1">
        {/* Sidebar and content wrapper */}
        <SidebarProvider defaultOpen={false}>
          {/* Left Sidebar - Proper implementation with Shadcn UI Sidebar */}
          {/* <aside className="hidden md:block"> */}
            <WikiArticleContents content={isClient ? article.content : ""} />
          {/* </aside> */}

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Mobile sidebar trigger */}
            <div className="p-2 md:hidden">
              <SidebarTrigger className="border border-[#d4bc8b] bg-[#f9f5eb] text-[#4b2e13]" />
            </div>

            {/* AI Features Alert */}
            {isClient && !UseAi && (
              <div className="p-4">
                <div className="rounded-md bg-[#e8dcc3] p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-[#5c3c10]" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#3a2a14]">
                        AI Features Disabled
                      </h3>
                      <div className="mt-2 text-sm text-[#5c3c10]">
                        AI features are currently disabled because I&apos;m
                        balling like that.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row">
              {/* Large Image on the Left */}
              <div className="p-4 md:sticky md:top-0 md:h-screen md:w-80">
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
                    <p className="mt-2 text-xs text-[#605244]">
                      {article.title} - Representative image
                    </p>
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
                        <h1 className="wiki-title font-serif text-3xl font-bold text-[#3a2a14]">
                          {article.title}
                        </h1>
                        {isClient && article.title.includes("Zealand") && (
                          <p className="mt-2 text-[#5c3c10] italic">
                            Aotearoa (Māori)
                          </p>
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
                          <span>
                            Created{" "}
                            {isClient
                              ? formatDate(new Date(article.createdAt))
                              : "..."}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            Last updated{" "}
                            {isClient
                              ? formatDistanceToNow(new Date(article.updatedAt))
                              : "..."}
                          </span>
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
                          <h3 className="mb-2 font-medium text-[#4b2e13]">
                            Quick Facts
                          </h3>
                          <dl className="space-y-2 text-sm">
                            {article.quickFacts &&
                            Object.keys(article.quickFacts).length > 0 ? (
                              Object.entries(article.quickFacts).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between"
                                  >
                                    <dt className="font-medium text-[#4b2e13]">
                                      {key}:
                                    </dt>
                                    <dd className="text-[#605244]">
                                      {String(value)}
                                    </dd>
                                  </div>
                                ),
                              )
                            ) : (
                              <div className="text-center text-[#605244] italic">
                                No quick facts available for this article.
                              </div>
                            )}
                          </dl>
                        </div>
                      )}

                      {/* Article Content */}
                      <div className="mb-6">
                        <h2 className="mb-4 border-b border-[#d4bc8b] pb-2 font-serif text-xl font-bold text-[#3a2a14]">
                          Overview
                        </h2>
                        <div className="prose max-w-none text-[#3a2a14]">
                          {isClient ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {firstParagraph}
                            </ReactMarkdown>
                          ) : (
                            <p>Loading content...</p>
                          )}
                        </div>
                      </div>

                      {/* Rest of Article Content */}
                      <div className="prose max-w-none text-[#3a2a14]">
                        {isClient ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {restContent}
                          </ReactMarkdown>
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
                            <h3 className="font-serif font-bold text-[#3a2a14]">
                              Revision History
                            </h3>
                          </div>
                          <p className="mb-4 text-sm text-[#5c3c10]">
                            This article has been edited{" "}
                            {article.revisions.length} times
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
                              <Button
                                variant="link"
                                className="px-0 text-[#5c3c10] hover:text-[#3a2a14]"
                                asChild
                              >
                                <Link href={`/wiki/${article.slug}/history`}>
                                  View all revisions
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="talk">
                      <div className="p-4 text-[#5c3c10]">
                        {article.talkContent ? (
                          <div className="prose max-w-none text-[#3a2a14]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {article.talkContent}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p>
                              No discussion has been started for this article
                              yet.
                            </p>
                            {session?.user && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                                asChild
                              >
                                <Link href={`/wiki/${article.slug}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Start Discussion
                                </Link>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="sources">
                      <div className="p-4 text-[#5c3c10]">
                        {article.sources ? (
                          <div className="prose max-w-none text-[#3a2a14]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {article.sources}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p>
                              No sources have been added to this article yet.
                            </p>
                            {session?.user && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                                asChild
                              >
                                <Link href={`/wiki/${article.slug}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Add Sources
                                </Link>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>

      {/* Footer */}
      <footer className="mt-8 bg-[#3a2a14] p-4 text-center text-[#f9f5eb]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f9f5eb]">
              <span className="font-serif font-bold text-[#3a2a14]">W</span>
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
  );
}
