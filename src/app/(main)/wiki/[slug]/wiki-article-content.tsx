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

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  // Handle content change from reading level
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
  };

  return (
    <motion.div
      className="flex min-h-screen flex-col bg-[#f5f0e6]"
      id="article-top"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-1">
        {/* Sidebar and content wrapper */}
        <SidebarProvider defaultOpen={true}>
          {/* Left Sidebar */}
          <WikiArticleContents content={currentContent} />

          {/* Main Content Area */}
          <div className="relative flex-1">
            {/* Mobile sidebar trigger */}
            <div className="fixed top-14 left-0 z-10 p-2 md:hidden">
              <SidebarTrigger className="border border-[#d4bc8b] bg-[#f9f5eb] text-[#4b2e13]" />
            </div>

            {/* AI Features Alert */}
            {!UseAi && (
              <motion.div className="p-4" variants={fadeInVariants}>
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
              </motion.div>
            )}

            <div className="mx-auto flex max-w-4xl flex-col md:flex-row">
              {/* Large Image on the Left */}
              <div className="hidden p-4 md:sticky md:top-0 md:h-screen md:w-80">
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

              {/* <Image
                src={article.imageUrl ?? ""}
                alt={article.title}
                className="h-auto w-full object-cover absolute top-0 left-0"
                width={10000}
                height={10000}
              /> */}

              {/* Main Article Content */}
              <main className="flex-1 p-4">
                <motion.div
                  className="rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-6 shadow-sm"
                  variants={itemVariants}
                >
                  {/* Reading Level Slider */}
                  {/* {UseAi && ( */}
                  <WikiArticleReadingLevel
                    articleId={article.id}
                    onContentChange={handleContentChange}
                  />
                  {/* )} */}

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
                      <motion.div
                        className="mb-6 border-b border-[#d4bc8b] pb-4"
                        variants={itemVariants}
                      >
                        <motion.h1
                          className="wiki-title font-serif text-3xl font-bold text-[#3a2a14]"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          {article.title}
                        </motion.h1>
                      </motion.div>

                      {/* Article Metadata */}
                      <motion.div
                        className="mb-6 flex flex-wrap items-center gap-4 text-sm text-[#5c3c10]"
                        variants={itemVariants}
                      >
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{article.author.name ?? "Anonymous"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Created {formatDate(new Date(article.createdAt))}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
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
                            className="mb-6 rounded-lg border border-[#d4bc8b] bg-[#e8dcc3] p-4"
                            variants={itemVariants}
                          >
                            <h3 className="mb-4 font-serif text-lg font-semibold text-[#3a2a14]">
                              Quick Facts
                            </h3>
                            <dl className="space-y-3">
                              {Object.entries(
                                article.quickFacts as Record<string, unknown>,
                              ).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between border-b border-[#d4bc8b] pb-2 last:border-b-0"
                                >
                                  <dt className="font-medium text-[#4b2e13]">
                                    {key}
                                  </dt>
                                  <dd className="text-[#605244] prose">
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
                        className="prose max-w-none font-serif [&>:where(h1,h2,h3,h4,h5,h6)]:scroll-mt-24"
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

                      {/* Action Buttons */}
                      <motion.div
                        className="mt-8 mb-8 flex flex-wrap items-center gap-2"
                        variants={itemVariants}
                      >
                        {session?.user && (
                          <>
                            {/* <Button
                              variant="outline"
                              size="sm"
                              className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                              asChild
                            >
                              <Link href="/wiki/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Article
                              </Link>
                            </Button> */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                              asChild
                            >
                              <Link href={`/wiki/${article.slug}/history`}>
                                <History className="mr-2 h-4 w-4" />
                                History
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
                        {/* <AISummaryDialog articleId={article.id} /> */}
                      </motion.div>

                      {/* Revision History */}
                      {article.revisions.length > 0 && (
                        <motion.div
                          className="mt-8 rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-4"
                          variants={itemVariants}
                        >
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
                        </motion.div>
                      )}
                    </TabsContent>

                    <TabsContent value="talk">
                      <div className="p-4 text-[#5c3c10]">
                        {article.talkContent ? (
                          <div className="prose max-w-none text-[#3a2a14]">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
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
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
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
                </motion.div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </motion.div>
  );
}
