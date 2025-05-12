"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Check, X, ArrowLeft, User, Clock, Plus, Minus } from "lucide-react";
import { formatDateTime } from "~/lib/date-utils";
import { handleTRPCMutation } from "~/lib/toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "next-themes";
import { generateTextDiff } from "~/lib/diff-utils";
import { cn } from "~/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";

interface Revision {
  id: string;
  content: string;
  summary: string | null;
  createdAt: Date;
  articleId: string;
  editor: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Comparison {
  currentRevision: Revision;
  oldRevision: {
    id: string;
    content: string;
    summary: string | null;
    createdAt: Date;
    editor: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
  article: {
    id: string;
    title: string;
    slug: string;
    content: string;
  };
}

interface PreviewPendingRevisionContentProps {
  comparison: Comparison;
}

export function PreviewPendingRevisionContent({
  comparison,
}: PreviewPendingRevisionContentProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [activeTab, setActiveTab] = useState("diff");

  const { currentRevision, oldRevision, article } = comparison;

  // Calculate diff between old content and new revision content
  const diffResult = generateTextDiff(
    oldRevision.content,
    currentRevision.content,
  );

  const isDarkMode = resolvedTheme === "dark";

  // Approve revision mutation
  const approveRevisionMutation =
    api.admin.articles.approveRevision.useMutation({
      onSuccess: () => {
        router.push("/admin/approvals");
      },
    });

  // Reject revision mutation
  const rejectRevisionMutation = api.admin.articles.rejectRevision.useMutation({
    onSuccess: () => {
      router.push("/admin/approvals");
    },
  });

  // Handle approving a revision
  const handleApproveRevision = async () => {
    setIsApproving(true);
    try {
      await handleTRPCMutation(
        () =>
          approveRevisionMutation.mutateAsync({
            revisionId: currentRevision.id,
          }),
        "Revision approved successfully",
        "Failed to approve revision",
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Handle rejecting a revision
  const handleRejectRevision = async () => {
    setIsRejecting(true);
    try {
      await handleTRPCMutation(
        () =>
          rejectRevisionMutation.mutateAsync({
            revisionId: currentRevision.id,
          }),
        "Revision rejected successfully",
        "Failed to reject revision",
      );
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="mr-2" asChild>
            <Link href="/admin/approvals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Approvals
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            Preview Revision: {article.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleApproveRevision}
            disabled={isApproving}
          >
            <Check className="mr-2 h-4 w-4" />
            {isApproving ? "Approving..." : "Approve"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRejectRevision}
            disabled={isRejecting}
          >
            <X className="mr-2 h-4 w-4" />
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-900/20">
        <AlertTitle>Preview Mode</AlertTitle>
        <AlertDescription>
          You are viewing this revision in preview mode as an administrator.
          This revision is not yet approved and is not visible to regular users.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Revision Information</CardTitle>
          <CardDescription>Showing changes to article content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-md border p-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-semibold">
                Current Article Version
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span>{oldRevision.editor.name ?? "Current Version"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-semibold">Pending Revision</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span>{currentRevision.editor.name ?? "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>
                    {formatDateTime(new Date(currentRevision.createdAt))}
                  </span>
                </div>
                {currentRevision.summary && (
                  <div className="mt-2 text-sm">
                    <strong>Summary:</strong> {currentRevision.summary}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm",
                  isDarkMode ? "bg-red-950" : "bg-red-100",
                )}
              >
                <Minus
                  className={cn(
                    "h-3 w-3",
                    isDarkMode ? "text-red-400" : "text-red-600",
                  )}
                />
              </div>
              <span className="text-sm">
                {diffResult.stats.deletions} line
                {diffResult.stats.deletions !== 1 ? "s" : ""} removed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm",
                  isDarkMode ? "bg-green-950" : "bg-green-100",
                )}
              >
                <Plus
                  className={cn(
                    "h-3 w-3",
                    isDarkMode ? "text-green-400" : "text-green-600",
                  )}
                />
              </div>
              <span className="text-sm">
                {diffResult.stats.additions} line
                {diffResult.stats.additions !== 1 ? "s" : ""} added
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Content Changes</CardTitle>
              <CardDescription>
                Viewing differences between versions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-4 flex justify-end">
              <TabsList>
                <TabsTrigger value="diff">View Changes</TabsTrigger>
                <TabsTrigger value="current">Current Version</TabsTrigger>
                <TabsTrigger value="new">New Version</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="diff">
              <div className="overflow-x-auto rounded-lg border p-4 dark:border-gray-700">
                <pre className="font-mono text-sm">
                  {diffResult.changes.map((change, index) => (
                    <div
                      key={index}
                      className={cn(
                        change.added
                          ? isDarkMode
                            ? "bg-green-950/50 text-green-300"
                            : "bg-green-50 text-green-800"
                          : change.removed
                            ? isDarkMode
                              ? "bg-red-950/50 text-red-300"
                              : "bg-red-50 text-red-800"
                            : isDarkMode
                              ? "text-gray-300"
                              : "text-gray-700",
                      )}
                    >
                      {change.value
                        .split("\n")
                        .map((line: string, lineIndex: number) => (
                          <div
                            key={`${index}-${lineIndex}`}
                            className="whitespace-pre-wrap"
                          >
                            {change.added && (
                              <span
                                className={
                                  isDarkMode
                                    ? "mr-2 text-green-400"
                                    : "mr-2 text-green-600"
                                }
                              >
                                +
                              </span>
                            )}
                            {change.removed && (
                              <span
                                className={
                                  isDarkMode
                                    ? "mr-2 text-red-400"
                                    : "mr-2 text-red-600"
                                }
                              >
                                -
                              </span>
                            )}
                            {!change.added && !change.removed && (
                              <span className="mr-2 text-gray-400">&nbsp;</span>
                            )}
                            {line}
                          </div>
                        ))}
                    </div>
                  ))}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="current">
              <div className="prose dark:prose-invert max-w-none rounded-lg border p-4 dark:border-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {oldRevision.content}
                </ReactMarkdown>
              </div>
            </TabsContent>

            <TabsContent value="new">
              <div className="prose dark:prose-invert max-w-none rounded-lg border p-4 dark:border-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentRevision.content}
                </ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-muted/40 border-t px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                Article URL: <code>/wiki/{article.slug}</code>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/articles/${article.id}`}>Edit Article</Link>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
