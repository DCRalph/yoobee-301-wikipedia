"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";
import { ArrowLeft, Clock, User, AlertTriangle } from "lucide-react";
import { formatDateTime } from "~/lib/date-utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Revision {
  id: string;
  content: string;
  summary: string | null;
  createdAt: Date;
  article: {
    id: string;
    title: string;
    slug: string;
    published: boolean;
  };
  editor: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface RevisionContentProps {
  revision: Revision;
}

export function RevisionContent({ revision }: RevisionContentProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isModerator = session?.user?.role === Role.MODERATOR;
  const canEdit = isAdmin || isModerator;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            asChild
          >
            <Link href={`/wiki/${revision.article.slug}/history`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            {revision.article.title} - Revision
          </h2>
        </div>
      </div>

      {!revision.article.published && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <p className="text-sm text-yellow-700">
                You're viewing an unpublished revision.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Revision Information</CardTitle>
          <CardDescription>
            Details about this specific revision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium">Created by</h3>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  {revision.editor.name ?? "Anonymous"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Date</h3>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(new Date(revision.createdAt))}
                </p>
              </div>
              {revision.summary && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium">Edit Summary</h3>
                  <p className="text-muted-foreground text-sm">
                    {revision.summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="prose prose-slate dark:prose-invert max-w-none">
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>
            The content of this revision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4">
            <Markdown remarkPlugins={[remarkGfm]}>
              {revision.content}
            </Markdown>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/wiki/${revision.article.slug}`}>
                View Current Article
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/wiki/${revision.article.slug}/history`}>
                View History
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 