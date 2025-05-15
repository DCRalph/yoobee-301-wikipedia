"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ArrowLeft, CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { formatDate } from "~/lib/date-utils";
import { api } from "~/trpc/react";
import { handleTRPCMutation } from "~/lib/toast";

interface RevisionPreviewContentProps {
  revision: {
    id: string;
    content: string;
    createdAt: Date;
    editor: {
      id: string;
      name: string | null;
      image: string | null;
    };
    article: {
      id: string;
      title: string;
      slug: string;
      content: string;
    };
  };
}

export function RevisionPreviewContent({
  revision,
}: RevisionPreviewContentProps) {
  const router = useRouter();
  const [isActionPending, setIsActionPending] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("revision");

  const approveRevision = api.admin.articles.approveRevision.useMutation({
    onSuccess: () => {
      // Redirect back to approvals page after success
      router.push("/admin/approvals");
    },
    onError: () => {
      setIsActionPending(false);
    },
  });

  const rejectRevision = api.admin.articles.rejectRevision.useMutation({
    onSuccess: () => {
      // Redirect back to approvals page after success
      router.push("/admin/approvals");
    },
    onError: () => {
      setIsActionPending(false);
    },
  });

  const handleApprove = async () => {
    setIsActionPending(true);
    await handleTRPCMutation(
      () => approveRevision.mutateAsync({ revisionId: revision.id }),
      "Revision approved successfully",
      "Failed to approve revision",
    );
  };

  const handleReject = async () => {
    setIsActionPending(true);
    await handleTRPCMutation(
      () => rejectRevision.mutateAsync({ revisionId: revision.id }),
      "Revision rejected successfully",
      "Failed to reject revision",
    );
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/approvals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Approvals
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            Revision: {revision.article.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isActionPending}
            onClick={handleApprove}
          >
            {isActionPending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isActionPending}
            onClick={handleReject}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revision Details</CardTitle>
          <CardDescription>
            Review the proposed changes to this article
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground mb-6 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>
                Edited by {revision.editor.name ?? "Anonymous"} on{" "}
                {formatDate(new Date(revision.createdAt))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Version</TabsTrigger>
          <TabsTrigger value="revision">Proposed Revision</TabsTrigger>
          <TabsTrigger value="diff">Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-0">
          <div
            className={`prose max-w-none overflow-auto rounded-md border p-4`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {revision.article.content}
            </ReactMarkdown>
          </div>
        </TabsContent>

        <TabsContent value="revision" className="mt-0">
          <div
            className={`prose max-w-none overflow-auto rounded-md border p-4`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {revision.content}
            </ReactMarkdown>
          </div>
        </TabsContent>

        <TabsContent value="diff" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Changes Overview</CardTitle>
              <CardDescription>
                Compare the current version with the proposed revision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Content Changes:</h3>
                  <div className="text-muted-foreground">
                    {revision.article.content === revision.content ? (
                      <span>No changes to content</span>
                    ) : (
                      <span>Content has been modified</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          disabled={isActionPending}
          onClick={handleApprove}
        >
          {isActionPending ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve Revision
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isActionPending}
          onClick={handleReject}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject Revision
        </Button>
      </div>
    </div>
  );
}
