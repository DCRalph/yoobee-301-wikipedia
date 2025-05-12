"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { CircleCheckIcon, CircleXIcon, LoaderIcon, ArrowLeft } from "lucide-react";
import { api } from "~/trpc/react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "~/server/api/root";
import type { ModerationResult } from "~/lib/ai-moderator";
import { AIDisabledMessage } from "../ai-disabled-message";
import Link from "next/link";

export default function TestModeratorPage() {
  const [oldContent, setOldContent] = useState("");
  const [newContent, setNewContent] = useState("");
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if AI features are enabled
  const { data: settings, isLoading: settingsLoading } = api.admin.settings.getPublic.useQuery();
  const isAIEnabled = settings?.enableAIFeatures ?? false;

  // Set up tRPC mutation for content moderation
  const moderatorMutation = api.testing.testModeration.useMutation({
    onSuccess: (data: ModerationResult) => {
      setResult(data);
      setIsLoading(false);
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      console.error("Error testing moderator:", err);
      setError(err.message ?? "Failed to test moderator");
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
      moderatorMutation.mutate({
        oldContent,
        newContent,
      });
    } catch (err) {
      console.error("Error in test handler:", err);
      setError(err instanceof Error ? err.message : "Failed to test moderator");
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
      <h1 className="text-3xl font-bold mb-6">AI Moderator Test Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Original Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter original content here (for calculating diff)"
              value={oldContent}
              onChange={(e) => setOldContent(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter new content to moderate"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mb-8">
        <Button
          onClick={handleTest}
          disabled={isLoading || !newContent.trim() || !isAIEnabled}
          className="w-40"
        >
          {isLoading ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Moderation"
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className={result.isUseful ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="flex items-center">
              {result.isUseful ? (
                <>
                  <CircleCheckIcon className="mr-2 h-5 w-5 text-green-500" />
                  Content Approved
                </>
              ) : (
                <>
                  <CircleXIcon className="mr-2 h-5 w-5 text-red-500" />
                  Content Rejected
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap bg-muted p-4 rounded">
              {result.reason}
              <br />
              <br />
              <b>Factual accuracy and relevance:</b> {result.factual_accuracy_and_relevance}
              <br />
              <br />
              <b>Coherence and readability:</b> {result.coherence_and_readability}
              <br />
              <br />
              <b>Substance:</b> {result.substance}
              <br />
              <br />
              <b>Contribution value:</b> {result.contribution_value}
              <br />
              <br />
              <b>Score:</b> {result.score}
              <br />
              <br />
              <b>Error:</b> {result.error}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 