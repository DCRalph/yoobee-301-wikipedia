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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Edit, Clock, User, Calendar, History, Plus, RefreshCw, Brain } from "lucide-react";
import { formatDate, formatDistanceToNow } from "~/lib/date-utils";
import { useTheme } from "next-themes";
import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

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
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [level, setLevel] = useState<"novice" | "intermediate" | "advanced">("intermediate");

  const summarizeArticle = api.articles.summarize.useMutation({
    onSuccess: (data) => {
      setSummary(data.summary);
      setIsSummarizing(false);
      toast.success("Summary generated successfully!");
    },
    onError: (error) => {
      setIsSummarizing(false);
      toast.error(`Failed to generate summary: ${error.message}`);
    },
  });

  const saveSummary = api.articles.saveSummary.useMutation({
    onSuccess: () => {
      setIsSavingSummary(false);
      // if (data.message) {
      //   toast.success(data.message);
      // } else {
      toast.success("Summary saved successfully!");
      // }
    },
    onError: (error) => {
      setIsSavingSummary(false);
      toast.error(`Failed to save summary: ${error.message}`);
    },
  });

  const handleSummarize = () => {
    setIsSummarizing(true);
    summarizeArticle.mutate({
      articleId: article.id,
      level
    });
  };

  const handleSaveSummary = () => {
    if (!summary) return;

    setIsSavingSummary(true);
    saveSummary.mutate({
      articleId: article.id,
      summary,
      level
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-4">
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

      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm mb-6">
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

      <div className="flex items-center gap-2 mb-8">
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Brain className="mr-2 h-4 w-4" />
              AI Summarize
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>AI Summary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mb-4" />
                  <p className="text-muted-foreground">Generating summary...</p>
                </div>
              ) : summary ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <p className="text-center">Generate an AI summary of this article</p>

                  <div className="flex flex-col gap-4 items-center">
                    <div className="w-full max-w-xs">
                      <label className="block text-sm font-medium mb-2">
                        Summarization Level
                      </label>
                      <Select
                        value={level}
                        onValueChange={(value) => setLevel(value as "novice" | "intermediate" | "advanced")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novice">Novice</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleSummarize}>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Summary
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={!summary}
                onClick={() => setSummary(null)}
              >
                Reset
              </Button>
              {summary && session?.user && (
                <Button
                  disabled={isSavingSummary}
                  onClick={handleSaveSummary}
                >
                  {isSavingSummary ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Summary</>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
