"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

// Create a DiffComponent since it's missing
interface DiffComponentProps {
  oldText: string;
  newText: string;
}

function DiffComponent({ oldText, newText }: DiffComponentProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
        <div className="rounded-md bg-rose-50 p-4 dark:border dark:border-red-900/30 dark:bg-red-950/30">
          <div className="mb-2 text-sm font-medium">Previous Version:</div>
          <pre className="overflow-auto text-sm whitespace-pre-wrap">
            {oldText}
          </pre>
        </div>
        <div className="rounded-md bg-green-50 p-4 dark:border dark:border-green-900/30 dark:bg-green-950/30">
          <div className="mb-2 text-sm font-medium">New Version:</div>
          <pre className="overflow-auto text-sm whitespace-pre-wrap">
            {newText}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Helper function to format date
const formatDate = (date: Date | string) => {
  return format(new Date(date), "PPP");
};

type RevisionWithRelations =
  RouterOutputs["admin"]["revisions"]["getRevisionById"];

interface RevisionDetailContentProps {
  revision: RevisionWithRelations;
}

export function RevisionDetailContent({
  revision,
}: RevisionDetailContentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the current article content to compare with the revision
  const { data: currentArticle, isLoading: isArticleLoading } =
    api.user.articles.getBySlug.useQuery(
      {
        slug: revision.article.slug,
      },
      {
        enabled: !!revision.article.slug,
      },
    );

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
      return (
        <Badge
          variant="outline"
          className="bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-200"
        >
          Pending
        </Badge>
      );
    }
    if (approved) {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-200"
        >
          Approved
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-red-100 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-200"
      >
        Rejected
      </Badge>
    );
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
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Revision for {revision.article.title}</CardTitle>
              <CardDescription>
                Made by {revision.editor.name} on{" "}
                {formatDate(revision.createdAt)}
              </CardDescription>
            </div>
            <div>
              {getStatusBadge(revision.approved, revision.needsApproval)}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            <div>
              <h3 className="mb-2 text-lg font-medium">Revision Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <strong>Article:</strong>{" "}
                  <Link
                    href={`/admin/articles/${revision.article.id}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {revision.article.title}
                  </Link>
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  {revision.needsApproval
                    ? "Pending Approval"
                    : revision.approved
                      ? "Approved"
                      : "Rejected"}
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
                <h3 className="mb-2 text-lg font-medium">Revision Summary</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {revision.summary}
                </p>
              </div>
            )}

            {revision.aiMessage && (
              <div>
                <h3 className="mb-2 text-lg font-medium">AI Feedback</h3>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <ReactMarkdown>{revision.aiMessage}</ReactMarkdown>
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-lg font-medium">Changes</h3>
              {isArticleLoading ? (
                <Skeleton className="h-60 w-full" />
              ) : currentArticle ? (
                <DiffComponent
                  oldText={currentArticle.content}
                  newText={revision.content}
                />
              ) : (
                <div className="text-red-500 dark:text-red-400">
                  Could not load current article content for comparison
                </div>
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
          <div className={`prose max-w-none`}>
            <ReactMarkdown>{revision.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
