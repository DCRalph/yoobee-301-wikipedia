"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Brain, LoaderIcon, ArrowLeft } from "lucide-react";
import { api } from "~/trpc/react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "~/server/api/root";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AIDisabledMessage } from "../ai-disabled-message";
import Link from "next/link";

export default function TestSummarizerPage() {
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<"novice" | "intermediate" | "advanced">("intermediate");

  // Check if AI features are enabled
  const { data: settings, isLoading: settingsLoading } = api.admin.settings.getPublic.useQuery();
  const isAIEnabled = settings?.enableAIFeatures ?? false;

  // Set up a custom tRPC mutation for testing the summarizer
  const summarizerMutation = api.testing.testSummarize.useMutation({
    onSuccess: (data: { summary: string }) => {
      setSummary(data.summary);
      setIsLoading(false);
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      console.error("Error testing summarizer:", err);
      setError(err.message ?? "Failed to test summarizer");
      setIsLoading(false);
    },
  });

  function handleTest() {
    // Ensure AI is enabled before making the call
    if (!isAIEnabled) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call the tRPC mutation
      summarizerMutation.mutate({
        content,
        level,
      });
    } catch (err) {
      console.error("Error in test handler:", err);
      setError(err instanceof Error ? err.message : "Failed to test summarizer");
      setIsLoading(false);
    }
  }

  // If AI features are disabled, show the message instead
  if (!settingsLoading && !isAIEnabled) {
    return <AIDisabledMessage />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link href="/testing">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Testing
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">AI Summarizer Test Tool</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Article Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter article content to summarize"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px]"
          />
        </CardContent>
      </Card>

      <div className="mb-6">
        <Tabs
          defaultValue="intermediate"
          className="w-full"
          onValueChange={(value) =>
            setLevel(value as "novice" | "intermediate" | "advanced")
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="novice">Novice</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          <TabsContent
            value="novice"
            className="text-muted-foreground mt-3 text-sm"
          >
            Simple explanations using basic terminology, perfect for beginners.
          </TabsContent>
          <TabsContent
            value="intermediate"
            className="text-muted-foreground mt-3 text-sm"
          >
            Balanced complexity with some field-specific terminology.
          </TabsContent>
          <TabsContent
            value="advanced"
            className="text-muted-foreground mt-3 text-sm"
          >
            In-depth analysis using specialized terminology and concepts.
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-center mb-8">
        <Button
          onClick={handleTest}
          disabled={isLoading || !content.trim() || !isAIEnabled}
          className="w-40"
        >
          {isLoading ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Summary
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5" />
              Generated Summary ({level})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none prose-img:rounded-md">
              <Markdown remarkPlugins={[remarkGfm]}>{summary}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 