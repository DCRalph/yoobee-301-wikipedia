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
import { Check, X, ArrowLeft, User, Clock } from "lucide-react";
import { formatDateTime } from "~/lib/date-utils";
import { handleTRPCMutation } from "~/lib/toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";

import type { RouterOutputs } from "~/trpc/react";

interface PreviewPendingArticleContentProps {
  article: RouterOutputs["admin"]["articles"]["previewPendingArticle"];
}

export function PreviewPendingArticleContent({
  article,
}: PreviewPendingArticleContentProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Approve article mutation
  const approveArticleMutation = api.admin.articles.approve.useMutation({
    onSuccess: () => {
      router.push("/admin/approvals");
    },
  });

  // Reject article mutation
  const rejectArticleMutation = api.admin.articles.reject.useMutation({
    onSuccess: () => {
      router.push("/admin/approvals");
    },
  });

  // Handle approving an article
  const handleApproveArticle = async () => {
    setIsApproving(true);
    try {
      await handleTRPCMutation(
        () => approveArticleMutation.mutateAsync({ id: article.id }),
        "Article approved successfully",
        "Failed to approve article",
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Handle rejecting an article
  const handleRejectArticle = async () => {
    setIsRejecting(true);
    try {
      await handleTRPCMutation(
        () => rejectArticleMutation.mutateAsync({ id: article.id }),
        "Article rejected successfully",
        "Failed to reject article",
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
            Preview: {article.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleApproveArticle}
            disabled={isApproving}
          >
            <Check className="mr-2 h-4 w-4" />
            {isApproving ? "Approving..." : "Approve"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRejectArticle}
            disabled={isRejecting}
          >
            <X className="mr-2 h-4 w-4" />
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{article.title}</CardTitle>
              <CardDescription>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="text-muted-foreground h-4 w-4" />
                    <span>{article.author.name ?? "Anonymous"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span>{formatDateTime(new Date(article.createdAt))}</span>
                  </div>
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {article.needsApproval && (
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  Needs Approval
                </Badge>
              )}
              {!article.published && <Badge variant="outline">Draft</Badge>}
              {article.published && (
                <Badge variant="secondary" className="bg-green-600 text-white">
                  Published
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-8 bg-blue-50 dark:bg-blue-900/20">
            <AlertTitle>Preview Mode</AlertTitle>
            <AlertDescription>
              You are viewing this article in preview mode as an administrator.
              This content is not yet approved and is not visible to regular
              users.
            </AlertDescription>
          </Alert>

          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/40 border-t px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                Preview URL: <code>/wiki/{article.slug}</code>
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
