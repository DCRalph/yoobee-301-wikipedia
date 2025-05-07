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
import { Edit, Clock, User, Calendar, History, Plus } from "lucide-react";
import { formatDate, formatDistanceToNow } from "~/lib/date-utils";
import { useTheme } from "next-themes";

interface WikiArticleContentProps {
  article: {
    id: string;
    title: string;
    content: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      name: string | null;
      image: string | null;
    };
    revisions: Array<{
      id: string;
      createdAt: Date;
      editor: {
        name: string | null;
      };
    }>;
  };
}

export function WikiArticleContent({ article }: WikiArticleContentProps) {
  const { theme } = useTheme();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isModerator = session?.user?.role === Role.MODERATOR;
  const canEdit = isAdmin || isModerator;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {article.title}
        </h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
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

        <div className="flex items-center gap-2">
          {session?.user && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/wiki/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Article
              </Link>
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/articles/${article.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Article
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div
        className={`prose prose-zinc dark:prose-invert max-w-none ${theme == "pink" ? "pink" : ""}`}
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
