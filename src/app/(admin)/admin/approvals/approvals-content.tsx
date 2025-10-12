"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { formatDateTime } from "~/lib/date-utils";
import { Check, X, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { handleTRPCMutation } from "~/lib/toast";

export function ApprovalsContent() {
  const [activeTab, setActiveTab] = useState("articles");

  // Fetch data using API
  const {
    data: pendingArticles,
    isLoading: isLoadingArticles,
    refetch: refetchArticles,
  } = api.admin.articles.getPending.useQuery();

  const {
    data: pendingRevisions,
    isLoading: isLoadingRevisions,
    refetch: refetchRevisions,
  } = api.admin.articles.getPendingRevisions.useQuery();

  const approveArticle = api.admin.articles.approve.useMutation();
  const rejectArticle = api.admin.articles.reject.useMutation();
  const approveRevision = api.admin.articles.approveRevision.useMutation();
  const rejectRevision = api.admin.articles.rejectRevision.useMutation();

  const handleApproveArticle = async (id: string) => {
    await handleTRPCMutation(
      () => approveArticle.mutateAsync({ id }),
      "Article approved successfully",
      "Failed to approve article",
    );
    // Refresh the data
    await refetchArticles();
  };

  const handleRejectArticle = async (id: string) => {
    await handleTRPCMutation(
      () => rejectArticle.mutateAsync({ id }),
      "Article rejected successfully",
      "Failed to reject article",
    );
    // Refresh the data
    await refetchArticles();
  };

  const handleApproveRevision = async (revisionId: string) => {
    await handleTRPCMutation(
      () => approveRevision.mutateAsync({ revisionId }),
      "Revision approved successfully",
      "Failed to approve revision",
    );
    // Refresh the data
    await refetchRevisions();
  };

  const handleRejectRevision = async (revisionId: string) => {
    await handleTRPCMutation(
      () => rejectRevision.mutateAsync({ revisionId }),
      "Revision rejected successfully",
      "Failed to reject revision",
    );
    // Refresh the data
    await refetchRevisions();
  };

  const isLoading = isLoadingArticles || isLoadingRevisions;

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <span className="ml-2">Loading approvals...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Pending Approvals</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="articles">
            Articles ({pendingArticles?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="revisions">
            Revisions ({pendingRevisions?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <div className="space-y-4">
            {pendingArticles?.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <CardTitle>{article.title}</CardTitle>
                  <CardDescription>
                    Created by {article.author.name ?? "Anonymous"} on{" "}
                    {formatDateTime(new Date(article.createdAt))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/admin/approvals/preview/article/${article.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Link>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproveArticle(article.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectArticle(article.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!pendingArticles || pendingArticles.length === 0) && (
              <p className="text-muted-foreground text-center">
                No pending articles to review
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="revisions">
          <div className="space-y-4">
            {pendingRevisions?.map((revision) => (
              <Card key={revision.id}>
                <CardHeader>
                  <CardTitle>Revision for {revision.article.title}</CardTitle>
                  <CardDescription>
                    Edited by {revision.editor.name ?? "Anonymous"} on{" "}
                    {formatDateTime(new Date(revision.createdAt))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/admin/approvals/preview/revision/${revision.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Changes
                      </Link>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproveRevision(revision.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectRevision(revision.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!pendingRevisions || pendingRevisions.length === 0) && (
              <p className="text-muted-foreground text-center">
                No pending revisions to review
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
