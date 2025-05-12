"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import {
  User,
  Clock,
  ArrowLeft,
  Eye,
  Diff,
  CalendarDays,
  History,
  Edit,
} from "lucide-react";
import { formatDate, formatDateTime } from "~/lib/date-utils";
import { type RouterOutputs } from "~/trpc/react";

type ArticleHistory = RouterOutputs["user"]["articles"]["getBySlug"];

interface ArticleHistoryContentProps {
  article: ArticleHistory;
}

export function ArticleHistoryContent({ article }: ArticleHistoryContentProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isModerator = session?.user?.role === Role.MODERATOR;
  const canEdit = isAdmin || isModerator;

  // Sort revisions by date (newest first)
  const sortedRevisions = [...article.revisions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Revision History
          </h1>
          <p className="text-muted-foreground">
            All changes made to{" "}
            <span className="font-medium">{article.title}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="mr-2" asChild>
            <Link href={`/wiki/${article.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Article
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            Revision History: {article.title}
          </h2>
        </div>

        {canEdit && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/articles/${article.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Article
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Information</CardTitle>
          <CardDescription>
            Basic information about this article
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium">Created by</h3>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  {article.author.name ?? "Anonymous"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Created on</h3>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4" />
                  {formatDateTime(new Date(article.createdAt))}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Last updated</h3>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(new Date(article.updatedAt))}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Total revisions</h3>
                <p className="text-muted-foreground text-sm">
                  {article.revisions.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Complete Revision History
          </CardTitle>
          <CardDescription>
            All revisions ordered by date (newest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedRevisions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Editor</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRevisions.map((revision, index) => (
                  <TableRow key={revision.id}>
                    <TableCell className="align-top">
                      <div className="font-medium">
                        {formatDate(new Date(revision.createdAt))}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(revision.createdAt).toLocaleTimeString()}
                      </div>
                      {index === 0 && (
                        <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Current
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{revision.editor.name ?? "Anonymous"}</TableCell>
                    <TableCell>
                      <span className="line-clamp-2">
                        {revision.summary ?? "No summary provided"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <Link
                            href={`/wiki/${article.slug}/revision/${revision.id}`}
                          >
                            <span className="sr-only">View this revision</span>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {index > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <Link
                              href={`/wiki/${article.slug}/compare/${sortedRevisions[0]?.id ?? ""}/${revision.id}`}
                            >
                              <span className="sr-only">
                                Compare with current
                              </span>
                              <Diff className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="bg-muted text-muted-foreground flex flex-col items-center justify-center rounded-md py-12 text-center">
              <p className="mb-1">No revision history found</p>
              <p className="text-sm">This article has no recorded revisions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
