"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import {
  Edit,
  Clock,
  User,
  Calendar,
  History,
  Plus,
  AlertCircle,
  FileText,
  BookOpen,
  Share2,
  Star,
  Printer
} from "lucide-react";
import { formatDate, formatDistanceToNow } from "~/lib/date-utils";
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { AISummaryDialog } from "../components/AISummaryDialog";
import { WikiArticleReadingLevel } from "../components/wiki-article-reading-level";
import { WikiArticleSidebar } from "../components/wiki-article-sidebar";
import { WikiArticleContents } from "../components/wiki-article";
import type { RouterOutputs } from "~/trpc/react";

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

return (
  <div className="mx-auto max-w-7xl p-8 bg-[#f8f9fa]">
    {/* AI Features Alert */}
    {!UseAi && (
      <div className="mb-6 rounded-md bg-purple-100 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-purple-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800">AI Features Disabled</h3>
            <div className="mt-2 text-sm text-purple-700">
              AI features are currently disabled because I&apos;m balling like that.
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Sidebar */}
      <aside className="w-full shrink-0 lg:w-64">
        '<WikiArticleContents />'
      </aside>

      {/* Main Article Content */}
      <main className="flex-1">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          {/* Reading Level Slider */}
          <WikiArticleReadingLevel />

          {/* Article Tabs */}
          <Tabs defaultValue="article" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="article">Article</TabsTrigger>
              <TabsTrigger value="talk">Talk</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Article Title and Alerts */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{article.title}</h1>
            {article.title.includes("Zealand") && <p className="mt-2 text-gray-600">Aotearoa (Māori)</p>}
          </div>

          {/* Article Metadata */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{article.author.name ?? "Anonymous"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {formatDate(new Date(article.createdAt))}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Last updated {formatDistanceToNow(new Date(article.updatedAt))}</span>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" asChild>
              <Link href={`/wiki/${article.slug}/history`}>
                <History className="mr-2 h-4 w-4" />
                History
              </Link>
            </Button>
          </div>

          {/* Article Alerts */}
          {!article.published && (
            <div className="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {article.needsApproval
                      ? "This article is pending approval"
                      : !article.approved
                        ? "This article was rejected"
                        : "This article is not published"}
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    {article.needsApproval
                      ? "An admin will review this article before it is published."
                      : !article.approved
                        ? "This article was reviewed and rejected by an admin."
                        : "This article is currently in draft mode."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Revisions Alert */}
          {article.revisions.some((rev) => rev.needsApproval) && (
            <div className="mb-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Pending Revisions
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    This article has pending revisions that are waiting for admin
                    approval. Thank you for your contribution!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Article Content with Image */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              {/* Article Summary */}
              <div className="mb-6">
                <h2 className="mb-4 text-xl font-bold">Overview</h2>
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {article.content.split("\n\n")[0]}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Rest of Article Content */}
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {article.content.split("\n\n").slice(1).join("\n\n")}
                </ReactMarkdown>
              </div>
            </div>

            {/* Right Sidebar with Image */}
            <div className="md:col-span-1">
              <WikiArticleSidebar article={article} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {session?.user && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/wiki/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Article
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/wiki/${article.slug}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Article
                  </Link>
                </Button>
              </>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/articles/${article.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Admin Edit
                </Link>
              </Button>
            )}
            <AISummaryDialog articleId={article.id} />
          </div>

          {/* Revision History */}
          {article.revisions.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Revision History
                </CardTitle>
                <CardDescription>This article has been edited {article.revisions.length} times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {article.revisions.slice(0, 5).map((revision) => (
                    <div
                      key={revision.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <span className="font-medium">{revision.editor.name ?? "Anonymous"}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          {formatDate(new Date(revision.createdAt))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              {article.revisions.length > 5 && (
                <CardFooter>
                  <Button variant="link" className="px-0" asChild>
                    <Link href={`/wiki/${article.slug}/history`}>View all revisions</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  </div>
);
}