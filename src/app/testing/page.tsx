"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { Brain, Filter } from "lucide-react";
import { api } from "~/trpc/react";
import { AIDisabledMessage } from "./ai-disabled-message";

export default function TestingIndexPage() {
  // Check if AI features are enabled
  const { data: settings, isLoading: settingsLoading } = api.admin.settings.getPublic.useQuery();
  const isAIEnabled = settings?.enableAIFeatures ?? false;

  // If AI features are disabled, show the message instead
  if (!settingsLoading && !isAIEnabled) {
    return <AIDisabledMessage />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            AI Moderator Testing
          </CardTitle>
          <CardDescription>
            Test the AI moderation system with custom content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            The AI moderator evaluates wiki content for quality, relevance, and adherence to guidelines.
            Use this tool to test how the moderator would evaluate specific content.
          </p>
          <Button asChild>
            <Link href="/testing/test-moderator">
              Test AI Moderator
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Summarizer Testing
          </CardTitle>
          <CardDescription>
            Test the AI summary generation with custom content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            The AI summarizer creates concise summaries of wiki articles at different comprehension levels.
            Use this tool to test summary generation with your own content.
          </p>
          <Button asChild>
            <Link href="/testing/test-summarizer">
              Test AI Summarizer
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 