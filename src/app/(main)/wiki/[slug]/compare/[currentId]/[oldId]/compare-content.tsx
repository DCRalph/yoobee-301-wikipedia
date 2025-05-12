"use client";

import { useState } from "react";
import Link from "next/link";
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
import { ArrowLeft, User, Clock, Plus, Minus } from "lucide-react";
import { formatDateTime } from "~/lib/date-utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateTextDiff } from "~/lib/diff-utils";
import { useTheme } from "next-themes";
import { cn } from "~/lib/utils";

interface Revision {
  id: string;
  content: string;
  summary: string | null;
  createdAt: Date;
  editor: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface CompareContentProps {
  comparison: {
    currentRevision: Revision;
    oldRevision: Revision;
    article: {
      id: string;
      title: string;
      slug: string;
    };
  };
}

export function CompareContent({ comparison }: CompareContentProps) {
  const { theme, resolvedTheme } = useTheme();
  const { currentRevision, oldRevision, article } = comparison;
  const [activeTab, setActiveTab] = useState("unified");

  const diffResult = generateTextDiff(
    oldRevision.content,
    currentRevision.content,
  );
  console.log(JSON.stringify(diffResult.changes, null, 2));
  const isDarkMode = resolvedTheme === "dark";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="mr-2" asChild>
            <Link href={`/wiki/${article.slug}/history`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            {article.title} - Compare Revisions
          </h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Information</CardTitle>
          <CardDescription>
            Showing changes between two revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-md border p-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-semibold">Old Revision</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span>{oldRevision.editor.name ?? "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span suppressHydrationWarning>
                    {formatDateTime(new Date(oldRevision.createdAt))}
                  </span>
                </div>
                {oldRevision.summary && (
                  <div className="mt-2 text-sm">
                    <strong>Summary:</strong> {oldRevision.summary}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-md border p-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-semibold">Current Revision</h3>
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
                Viewing differences between the two revisions
              </CardDescription>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="max-w-fit"
            >
              <TabsList>
                <TabsTrigger value="unified">Unified View</TabsTrigger>
                <TabsTrigger value="sideBySide">Side-by-Side</TabsTrigger>
                <TabsTrigger value="rendered">Rendered Output</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="unified" className="mt-0">
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

            <TabsContent value="sideBySide" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-x-auto rounded-lg border p-4 dark:border-gray-700">
                  <h3 className="mb-2 text-sm font-semibold">Old Version</h3>
                  <pre className="font-mono text-sm whitespace-pre-wrap dark:text-gray-300">
                    {oldRevision.content}
                  </pre>
                </div>
                <div className="overflow-x-auto rounded-lg border p-4 dark:border-gray-700">
                  <h3 className="mb-2 text-sm font-semibold">
                    Current Version
                  </h3>
                  <pre className="font-mono text-sm whitespace-pre-wrap dark:text-gray-300">
                    {currentRevision.content}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rendered" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 dark:border-gray-700">
                  <h3 className="mb-2 text-sm font-semibold">
                    Old Version (Rendered)
                  </h3>
                  <div
                    className={`prose prose-zinc dark:prose-invert max-w-none ${theme == "pink" ? "pink" : ""}`}
                  >
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {oldRevision.content}
                    </Markdown>
                  </div>
                </div>
                <div className="rounded-lg border p-4 dark:border-gray-700">
                  <h3 className="mb-2 text-sm font-semibold">
                    Current Version (Rendered)
                  </h3>
                  <div
                    className={`prose prose-zinc dark:prose-invert max-w-none ${theme == "pink" ? "pink" : ""}`}
                  >
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {currentRevision.content}
                    </Markdown>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="flex space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/wiki/${article.slug}/revision/${oldRevision.id}`}>
                View Old Revision
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/wiki/${article.slug}/revision/${currentRevision.id}`}
              >
                View Current Revision
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/wiki/${article.slug}/history`}>View History</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
