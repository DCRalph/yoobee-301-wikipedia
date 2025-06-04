"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import {
  Edit,
  Clock,
  User,
  Calendar,
  History,
  MoreHorizontal,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { WikiArticleReadingLevel } from "../components/wiki-article-reading-level";
import { WikiArticleContents } from "../components/wiki-article-sidebar";
import { formatDate, formatDistanceToNow } from "~/lib/date-utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
// import { AISummaryDialog } from "../components/AISummaryDialog";
import { useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import React from "react";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import Image from "next/image";
import { motion } from "framer-motion";
import { markdownComponents } from "../components/custom-markdown-components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { AIDisabledMessage } from "~/app/testing/ai-disabled-message";
import { SimilarArticles } from "../components/similar-articles";

interface WikiArticleContentProps {
  article: RouterOutputs["user"]["articles"]["getBySlug"];
  UseAi: boolean;
}

export function WikiArticleContent({
  article,
  UseAi,
}: WikiArticleContentProps) {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === Role.ADMIN;
  const isModerator = session?.user?.role === Role.MODERATOR;
  const canEdit = isAdmin || isModerator;

  // State for article content
  const [currentContent, setCurrentContent] = useState(article.content);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Handle content change from reading level
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
  };

  return (
    <motion.div
      className="flex min-h-screen flex-col overflow-x-hidden bg-[#f5f0e6]"
      id="article-top"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-1 overflow-x-hidden">
        {/* Sidebar and content wrapper */}
        <SidebarProvider defaultOpen={true}>
          {/* Left Sidebar */}
          <WikiArticleContents content={currentContent} />

          {/* Main Content Area */}
          <div className="relative flex-1 overflow-x-hidden">
            {/* Mobile sidebar trigger */}
            <div className="fixed top-14 left-2 z-10 p-2 md:hidden">
              <SidebarTrigger className="border border-[#d4bc8b] bg-[#f9f5eb] text-[#4b2e13]" />
            </div>

            {/* AI Features Alert */}
            {!UseAi && <AIDisabledMessage />}

            <div className="mx-auto flex w-full max-w-4xl flex-col px-2 sm:px-4 md:flex-row lg:px-6">
              {/* Large Image on the Left */}
              <div className="hidden p-4 md:sticky md:top-0 md:h-screen md:w-80 md:flex-shrink-0">
                <motion.div className="h-full" variants={itemVariants}>
                  <div className="overflow-hidden">
                    <Image
                      src="/placeholder.svg?height=800&width=600"
                      alt={article.title}
                      className="h-auto w-full object-cover"
                      width={600}
                      height={800}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#605244]">
                    {article.title} - Representative image
                  </p>
                </motion.div>
              </div>

              {/* Main Article Content */}
              <main className="min-w-0 flex-1 sm:p-4 md:pl-6">
                <motion.div
                  className="rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-3 shadow-sm sm:p-6"
                  variants={itemVariants}
                >
                  {/* Reading Level Slider */}
                  <div className="mb-4 overflow-x-hidden">
                    <WikiArticleReadingLevel
                      articleId={article.id}
                      onContentChange={handleContentChange}
                    />
                  </div>

                  {/* Article Tabs */}
                  <div className="mb-6 overflow-x-hidden">
                    <Tabs defaultValue="article" className="flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
                        <TabsList className="grid w-full grid-cols-3 bg-[#e8dcc3] text-[#5c3c10] sm:w-auto">
                          <TabsTrigger
                            value="article"
                            className="text-xs data-[state=active]:bg-[#5c3c10] data-[state=active]:text-[#f9f5eb] sm:text-sm"
                          >
                            Article
                          </TabsTrigger>
                          <TabsTrigger
                            value="talk"
                            className="text-xs data-[state=active]:bg-[#5c3c10] data-[state=active]:text-[#f9f5eb] sm:text-sm"
                          >
                            Talk
                          </TabsTrigger>
                          <TabsTrigger
                            value="sources"
                            className="text-xs data-[state=active]:bg-[#5c3c10] data-[state=active]:text-[#f9f5eb] sm:text-sm"
                          >
                            Sources
                          </TabsTrigger>
                        </TabsList>

                        {session?.user && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3] sm:ml-2 sm:w-auto"
                              >
                                <MoreHorizontal className="mr-2 h-4 w-4" />
                                More
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/wiki/${article.slug}/history`}>
                                  <History className="mr-2 h-4 w-4" />
                                  History
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/wiki/${article.slug}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Article
                                </Link>
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/articles/${article.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Admin Edit
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <TabsContent value="article" className="mt-4">
                        {/* Article Title and Alerts */}
                        <motion.div
                          className="mb-6 border-b border-[#d4bc8b] pb-4"
                          variants={itemVariants}
                        >
                          <motion.h1
                            className="wiki-title font-serif text-2xl font-bold break-words text-[#3a2a14] sm:text-3xl"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            {article.title}
                          </motion.h1>
                        </motion.div>

                        {/* Article Metadata */}
                        <motion.div
                          className="mb-6 flex flex-col gap-2 text-sm text-[#5c3c10] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
                          variants={itemVariants}
                        >
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {article.author.name ?? "Anonymous"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              Created {formatDate(new Date(article.createdAt))}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              Last updated{" "}
                              {formatDistanceToNow(new Date(article.updatedAt))}
                            </span>
                          </div>
                        </motion.div>

                        {/* Quick Facts */}
                        {article.quickFacts &&
                          Object.keys(
                            article.quickFacts as Record<string, unknown>,
                          ).length > 0 && (
                            <motion.div
                              className="mb-6 rounded-lg border border-[#d4bc8b] bg-[#e8dcc3] p-3 sm:p-4"
                              variants={itemVariants}
                            >
                              <h3 className="mb-4 font-serif text-lg font-semibold text-[#3a2a14]">
                                Quick Facts
                              </h3>
                              <dl className="space-y-3 overflow-x-hidden">
                                {Object.entries(
                                  article.quickFacts as Record<string, unknown>,
                                ).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex flex-col gap-1 border-b border-[#d4bc8b] pb-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                                  >
                                    <dt className="font-medium break-words text-[#4b2e13]">
                                      {key}
                                    </dt>
                                    <dd className="prose min-w-0 flex-1 overflow-x-hidden text-[#605244]">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={markdownComponents}
                                      >
                                        {String(value)}
                                      </ReactMarkdown>
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            </motion.div>
                          )}

                        {/* Article Content */}
                        <motion.div
                          className="prose prose-sm sm:prose max-w-none overflow-x-hidden font-serif [&_*]:max-w-full [&_code]:break-words [&_pre]:overflow-x-auto [&_table]:overflow-x-auto [&>:where(h1,h2,h3,h4,h5,h6)]:scroll-mt-24"
                          variants={itemVariants}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSlug]}
                            components={markdownComponents}
                          >
                            {currentContent}
                          </ReactMarkdown>
                        </motion.div>

                        {/* Action Buttons - Removing this section since buttons are now in dropdown */}
                        <motion.div
                          className="mt-8 mb-8"
                          variants={itemVariants}
                        >
                          {/* No buttons here anymore - moved to dropdown */}
                        </motion.div>

                        {/* Revision History */}
                        {article.revisions.length > 0 && (
                          <motion.div
                            className="mt-8 rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-3 sm:p-4"
                            variants={itemVariants}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <History className="h-5 w-5 flex-shrink-0 text-[#5c3c10]" />
                              <h3 className="font-serif font-bold text-[#3a2a14]">
                                Revision History
                              </h3>
                            </div>
                            <p className="mb-4 text-sm text-[#5c3c10]">
                              This article has been edited{" "}
                              {article.revisions.length} times
                            </p>

                            <div className="space-y-4 overflow-x-hidden">
                              {article.revisions.slice(0, 5).map((revision) => (
                                <div
                                  key={revision.id}
                                  className="flex flex-col gap-1 border-b border-[#d4bc8b] pb-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="min-w-0">
                                    <span className="font-medium break-words text-[#3a2a14]">
                                      {revision.editor.name ?? "Anonymous"}
                                    </span>
                                    <span className="ml-2 block text-sm text-[#5c3c10] sm:inline">
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
                          </motion.div>
                        )}
                      </TabsContent>

                      <TabsContent value="talk" className="mt-4">
                        <div className="overflow-x-hidden p-2 text-[#5c3c10] sm:p-4">
                          {article.talkContent ? (
                            <div className="prose prose-sm sm:prose max-w-none overflow-x-hidden text-[#3a2a14] [&_*]:max-w-full [&_code]:break-words [&_pre]:overflow-x-auto [&_table]:overflow-x-auto">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {article.talkContent}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="mb-4">
                                No discussion has been started for this article
                                yet.
                              </p>
                              {session?.user && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
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

                      <TabsContent value="sources" className="mt-4">
                        <div className="overflow-x-hidden p-2 text-[#5c3c10] sm:p-4">
                          {article.sources ? (
                            <div className="prose prose-sm sm:prose max-w-none overflow-x-hidden text-[#3a2a14] [&_*]:max-w-full [&_code]:break-words [&_pre]:overflow-x-auto [&_table]:overflow-x-auto">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {article.sources}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="mb-4">
                                No sources have been added to this article yet.
                              </p>
                              {session?.user && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
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
                </motion.div>

                {/* Similar Articles Section */}
                <motion.div
                  className="mt-6 overflow-x-hidden"
                  variants={itemVariants}
                >
                  <SimilarArticles
                    articleId={article.id}
                    maxItems={5}
                    searchType="title"
                    titleWeight={0.3}
                    contentWeight={0.7}
                  />
                </motion.div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </motion.div>
  );
}
