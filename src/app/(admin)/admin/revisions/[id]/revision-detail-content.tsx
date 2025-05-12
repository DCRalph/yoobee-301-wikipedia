"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "~/components/ui/skeleton";
import { type RouterOutputs } from "~/trpc/react";
import { useTheme } from "next-themes";
import { cn } from "~/lib/utils";

// Create a DiffComponent since it's missing
interface DiffComponentProps {
  oldText: string;
  newText: string;
}

function DiffComponent({ oldText, newText, }: DiffComponentProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className={cn(
          "p-4 rounded-md",
          isDark ? "bg-red-950/30 border border-red-900/30" : "bg-rose-50"
        )}>
          <div className="text-sm font-medium mb-2">Previous Version:</div>
          <pre className="whitespace-pre-wrap text-sm overflow-auto">{oldText}</pre>
        </div>
        <div className={cn(
          "p-4 rounded-md",
          isDark ? "bg-green-950/30 border border-green-900/30" : "bg-green-50"
        )}>
          <div className="text-sm font-medium mb-2">New Version:</div>
          <pre className="whitespace-pre-wrap text-sm overflow-auto">{newText}</pre>
        </div>
      </div>
    </div>
  );
}

// Helper function to format date
const formatDate = (date: Date | string) => {
  return format(new Date(date), "PPP");
};

type RevisionWithRelations = RouterOutputs["admin"]["revisions"]["getRevisionById"];

interface RevisionDetailContentProps {
  revision: RevisionWithRelations;
}

export function RevisionDetailContent({ revision }: RevisionDetailContentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isPinkTheme, setIsPinkTheme] = useState(false);

  useEffect(() => {
    setIsPinkTheme(resolvedTheme === "pink");
  }, [resolvedTheme]);

  // Fetch the current article content to compare with the revision
  const { data: currentArticle, isLoading: isArticleLoading } =
    api.user.articles.getBySlug.useQuery({
      slug: revision.article.slug
    }, {
      enabled: !!revision.article.slug,
    });

  // Set up mutations for approving and rejecting
  const utils = api.useUtils();

  // Mutation to approve a revision
  const approveMutation = api.admin.revisions.approveRevision.useMutation({
    onSuccess: () => {
      toast.success("Revision approved successfully");
      router.refresh();
      router.push("/admin/revisions");
      void utils.admin.revisions.getAllRevisions.invalidate();
    },
    onError: (error) => {
      toast.error(`Error approving revision: ${error.message}`);
    },
  });

  // Mutation to reject a revision
  const rejectMutation = api.admin.revisions.rejectRevision.useMutation({
    onSuccess: () => {
      toast.success("Revision rejected");
      router.refresh();
      router.push("/admin/revisions");
      void utils.admin.revisions.getAllRevisions.invalidate();
    },
    onError: (error) => {
      toast.error(`Error rejecting revision: ${error.message}`);
    },
  });

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveMutation.mutateAsync({ revisionId: revision.id });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectMutation.mutateAsync({ revisionId: revision.id });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (approved: boolean, needsApproval: boolean) => {
    if (needsApproval) {
      return <Badge variant="outline" className={cn(
        isDark ? "bg-amber-900/30 text-amber-200 border-amber-800/50" : "bg-amber-100"
      )}>Pending</Badge>;
    }
    if (approved) {
      return <Badge variant="outline" className={cn(
        isDark ? "bg-green-900/30 text-green-200 border-green-800/50" : "bg-green-100"
      )}>Approved</Badge>;
    }
    return <Badge variant="outline" className={cn(
      isDark ? "bg-red-900/30 text-red-200 border-red-800/50" : "bg-red-100"
    )}>Rejected</Badge>;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Revision for {revision.article.title}</CardTitle>
              <CardDescription>
                Made by {revision.editor.name} on {formatDate(revision.createdAt)}
              </CardDescription>
            </div>
            <div>{getStatusBadge(revision.approved, revision.needsApproval)}</div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Revision Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <strong>Article:</strong>{" "}
                  <Link
                    href={`/admin/articles/${revision.article.id}`}
                    className="hover:underline text-blue-600 dark:text-blue-400"
                  >
                    {revision.article.title}
                  </Link>
                </div>
                <div>
                  <strong>Status:</strong> {revision.needsApproval ? "Pending Approval" : (revision.approved ? "Approved" : "Rejected")}
                </div>
                <div>
                  <strong>Editor:</strong> {revision.editor.name}
                </div>
                <div>
                  <strong>Date:</strong> {formatDate(revision.createdAt)}
                </div>
              </div>
            </div>

            {revision.summary && (
              <div>
                <h3 className="text-lg font-medium mb-2">Revision Summary</h3>
                <p className="text-gray-700 dark:text-gray-300">{revision.summary}</p>
              </div>
            )}

            {revision.aiMessage && (
              <div>
                <h3 className="text-lg font-medium mb-2">AI Feedback</h3>
                <div className={cn(
                  "p-4 rounded-lg",
                  isDark ? "bg-gray-800/50" : "bg-gray-50"
                )}>
                  <ReactMarkdown>{revision.aiMessage}</ReactMarkdown>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-2">Changes</h3>
              {isArticleLoading ? (
                <Skeleton className="h-60 w-full" />
              ) : currentArticle ? (
                <DiffComponent
                  oldText={currentArticle.content}
                  newText={revision.content}
                />
              ) : (
                <div className="text-red-500 dark:text-red-400">Could not load current article content for comparison</div>
              )}
            </div>
          </div>
        </CardContent>

        {revision.needsApproval && (
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isLoading}
              className="border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
            >
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              Approve
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Content</CardTitle>
          <CardDescription>
            The complete content of this revision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`prose prose-zinc dark:prose-invert max-w-none ${isPinkTheme ? "pink" : ""
            }`}
          >
            <ReactMarkdown>{revision.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div >
  );
} 