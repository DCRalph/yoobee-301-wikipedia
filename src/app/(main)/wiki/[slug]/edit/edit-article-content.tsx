"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Save,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { handleTRPCMutation } from "~/lib/toast";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

interface EditArticleContentProps {
  article: {
    id: string;
    title: string;
    slug: string;
    content: string;
    published: boolean;
    approved: boolean;
    needsApproval: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
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

export function EditArticleContent({ article }: EditArticleContentProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState(article.content);
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [aiDialog, setAiDialog] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiApproved, setAiApproved] = useState<boolean | null>(null);

  // Create revision mutation
  const createRevision = api.user.articles.createRevision.useMutation({
    onError: (error) => {
      setError(`Failed to submit changes: ${error.message}`);
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Don't submit if content hasn't changed
    if (content === article.content) {
      toast.warning("No changes detected");
      return;
    }

    const result = await handleTRPCMutation(
      () =>
        createRevision.mutateAsync({
          articleId: article.id,
          content,
        }),
      "Your changes have been submitted for review",
      "Failed to submit changes",
    );

    // Check if AI has flagged the content and show dialog if needed
    if (result.result?.checkedByAi) {
      setAiApproved(result.result.approved);
      if (result.result.aiMessage) {
        setAiMessage(result.result.aiMessage);
      } else {
        setAiMessage(
          result.result.approved
            ? "AI has reviewed and approved your submission."
            : "AI has reviewed your submission and found potential issues.",
        );
      }
      setAiDialog(true);
    } else {
      router.push(`/wiki/${article.slug}`);
      router.refresh();
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Dialog open={aiDialog} onOpenChange={setAiDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {aiApproved ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              AI Content Review
            </DialogTitle>
            <DialogDescription>
              {aiApproved ? (
                <span className="text-green-700 dark:text-green-400">
                  Your changes have been approved and published automatically.
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">
                  Your changes have been submitted for manual review by a
                  moderator.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Alert
            className={cn(
              "mb-4",
              aiApproved
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
            )}
          >
            <AlertTitle
              className={cn(
                "flex items-center gap-2",
                aiApproved
                  ? "text-green-800 dark:text-green-200"
                  : "text-amber-800 dark:text-amber-200",
              )}
            >
              {aiApproved ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Changes Accepted
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Changes Require Review
                </>
              )}
            </AlertTitle>
            <AlertDescription
              className={cn(
                aiApproved
                  ? "text-green-700 dark:text-green-300"
                  : "text-amber-700 dark:text-amber-300",
              )}
            >
              {aiApproved
                ? "The AI system has approved your changes and they are now live on the article."
                : "The AI system has flagged your changes for manual review. A moderator will review them shortly."}
            </AlertDescription>
          </Alert>

          {aiMessage && (
            <div className="prose dark:prose-invert max-w-none py-4">
              <ScrollArea className="h-[50vh]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiMessage}
                </ReactMarkdown>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAiDialog(false);
                router.push(`/wiki/${article.slug}`);
                router.refresh();
              }}
            >
              {aiApproved ? "Continue to Article" : "Acknowledge and Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/wiki/${article.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Article
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            Editing: {article.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={createRevision.isPending}
            onClick={handleSubmit}
          >
            {createRevision.isPending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Submit for Review
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Article Guidelines</CardTitle>
          <CardDescription>
            Your changes will be reviewed by a moderator before being published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5">
            <li>Focus on making accurate and helpful improvements</li>
            <li>Maintain a neutral point of view</li>
            <li>Content should be properly formatted using Markdown</li>
            <li>Cite reliable sources when adding new information</li>
          </ul>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="editor">
            <FileText className="mr-2 h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-0">
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article content here using Markdown..."
            className="min-h-[500px] font-mono"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div
            className={`prose min-h-[500px] max-w-none rounded-md border p-4`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={createRevision.isPending}
          onClick={handleSubmit}
        >
          {createRevision.isPending ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Submit for Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
