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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { ArrowLeft, User, Clock, Plus, Minus } from "lucide-react";
import { formatDateTime } from "~/lib/date-utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateTextDiff } from "~/lib/diff-utils";

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
  const { currentRevision, oldRevision, article } = comparison;
  const [activeTab, setActiveTab] = useState("unified");

  const diffResult = generateTextDiff(oldRevision.content, currentRevision.content);

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
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-semibold mb-2">Old Revision</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{oldRevision.editor.name ?? "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(new Date(oldRevision.createdAt))}</span>
                </div>
                {oldRevision.summary && (
                  <div className="text-sm mt-2">
                    <strong>Summary:</strong> {oldRevision.summary}
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="text-sm font-semibold mb-2">Current Revision</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{currentRevision.editor.name ?? "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(new Date(currentRevision.createdAt))}</span>
                </div>
                {currentRevision.summary && (
                  <div className="text-sm mt-2">
                    <strong>Summary:</strong> {currentRevision.summary}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center mt-4 space-x-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-red-100 flex items-center justify-center rounded-sm">
                <Minus className="h-3 w-3 text-red-600" />
              </div>
              <span className="text-sm">
                {diffResult.stats.deletions} line{diffResult.stats.deletions !== 1 ? 's' : ''} removed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-green-100 flex items-center justify-center rounded-sm">
                <Plus className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-sm">
                {diffResult.stats.additions} line{diffResult.stats.additions !== 1 ? 's' : ''} added
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
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
          <TabsContent value="unified" className="mt-0">
            <div className="border rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm font-mono">
                {diffResult.changes.map((change, index) => (
                  <div
                    key={index}
                    // className={
                    //   change.added
                    //     ? "bg-green-50 text-green-800"
                    //     : change.removed
                    //       ? "bg-red-50 text-red-800"
                    //       : "text-gray-700"
                    // }
                  >
                    {/* {change.value.split('\n').map((line: string, lineIndex: number) => (
                      <div key={`${index}-${lineIndex}`} className="whitespace-pre-wrap">
                        {change.added && <span className="text-green-600 mr-2">+</span>}
                        {change.removed && <span className="text-red-600 mr-2">-</span>}
                        {!change.added && !change.removed && <span className="text-gray-400 mr-2">&nbsp;</span>}
                        {line}
                      </div>
                    ))} */}
                  </div>
                ))}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="sideBySide" className="mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold mb-2">Old Version</h3>
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {oldRevision.content}
                </pre>
              </div>
              <div className="border rounded-lg p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold mb-2">Current Version</h3>
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {currentRevision.content}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rendered" className="mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Old Version (Rendered)</h3>
                <div className="prose prose-sm max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {oldRevision.content}
                  </Markdown>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Current Version (Rendered)</h3>
                <div className="prose prose-sm max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {currentRevision.content}
                  </Markdown>
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
        <CardFooter>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/wiki/${article.slug}/revision/${oldRevision.id}`}>
                View Old Revision
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/wiki/${article.slug}/revision/${currentRevision.id}`}>
                View Current Revision
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/wiki/${article.slug}/history`}>
                View History
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 