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
} from "lucide-react";
import { formatDate, formatDistanceToNow } from "~/lib/date-utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AISummaryDialog } from "../components/AISummaryDialog";
import type { RouterOutputs } from "~/trpc/react";

interface WikiArticleContentProps {
  article: RouterOutputs["user"]["articles"]["getBySlug"];
  UseAi: boolean;
}

export function WikiArticleContent({
  article,
  UseAi,
}: WikiArticleContentProps) {
  const { resolvedTheme } = useTheme();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isModerator = session?.user?.role === Role.MODERATOR;
  const canEdit = isAdmin || isModerator;
  const [isPinkTheme, setIsPinkTheme] = useState(false);

  useEffect(() => {
    setIsPinkTheme(resolvedTheme === "pink");
  }, [resolvedTheme]);

  return (
    <div className="mx-auto max-w-5xl p-8">
      {!UseAi && (
        <div className="mb-4 rounded-md bg-purple-50 p-4 dark:bg-purple-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-purple-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                AI Features Disabled
              </h3>
              <div className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                AI features are currently disabled because I&apos;m balling like
                that.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {article.title}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/wiki/${article.slug}/history`}>
              <History className="mr-2 h-4 w-4" />
              History
            </Link>
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground mb-6 flex flex-wrap items-center gap-3 text-sm">
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
          <span>
            Last updated {formatDistanceToNow(new Date(article.updatedAt))}
          </span>
        </div>
      </div>

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

      <div className="mb-8 flex items-center gap-2 overflow-x-auto">
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
        <AISummaryDialog articleId={article.id} isPinkTheme={isPinkTheme} />
      </div>

      <div
        className={`prose prose-zinc dark:prose-invert max-w-none ${
          isPinkTheme ? "pink" : ""
        }`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.content}
        </ReactMarkdown>
      </div>

      {article.revisions.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Revision History
            </CardTitle>
            <CardDescription>
              This article has been edited {article.revisions.length} times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {article.revisions.slice(0, 5).map((revision) => (
                <div
                  key={revision.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <span className="font-medium">
                      {revision.editor.name ?? "Anonymous"}
                    </span>
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
                <Link href={`/wiki/${article.slug}/history`}>
                  View all revisions
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
