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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { formatDateTime } from "~/lib/date-utils";
import { Check, X, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type PendingArticle = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
};

type PendingRevision = {
  id: string;
  createdAt: Date;
  article: {
    id: string;
    title: string;
    slug: string;
  };
  editor: {
    name: string | null;
    image: string | null;
  };
};

export function ApprovalsContent() {
  const [activeTab, setActiveTab] = useState("articles");

  // Fetch pending articles
  const { data: pendingArticles, refetch: refetchArticles } = api.articles.getPending.useQuery(
    undefined,
    { enabled: activeTab === "articles" }
  );

  // Fetch pending revisions
  const { data: pendingRevisions, refetch: refetchRevisions } = api.articles.getPendingRevisions.useQuery(
    undefined,
    { enabled: activeTab === "revisions" }
  );

  // Approve article mutation
  const approveArticleMutation = api.articles.approve.useMutation({
    onSuccess: () => {
      toast.success("Article approved successfully");
      void refetchArticles();
    },
    onError: (error) => {
      toast.error(`Failed to approve article: ${error.message}`);
    },
  });

  // Reject article mutation
  const rejectArticleMutation = api.articles.reject.useMutation({
    onSuccess: () => {
      toast.success("Article rejected successfully");
      void refetchArticles();
    },
    onError: (error) => {
      toast.error(`Failed to reject article: ${error.message}`);
    },
  });

  // Approve revision mutation
  const approveRevisionMutation = api.articles.approveRevision.useMutation({
    onSuccess: () => {
      toast.success("Revision approved successfully");
      void refetchRevisions();
    },
    onError: (error) => {
      toast.error(`Failed to approve revision: ${error.message}`);
    },
  });

  // Reject revision mutation
  const rejectRevisionMutation = api.articles.rejectRevision.useMutation({
    onSuccess: () => {
      toast.success("Revision rejected successfully");
      void refetchRevisions();
    },
    onError: (error) => {
      toast.error(`Failed to reject revision: ${error.message}`);
    },
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Pending Approvals</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="articles">Articles ({pendingArticles?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="revisions">Revisions ({pendingRevisions?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <div className="space-y-4">
            {(pendingArticles as PendingArticle[] | undefined)?.map((article) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/wiki/${article.slug}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Link>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        approveArticleMutation.mutate({ id: article.id });
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        rejectArticleMutation.mutate({ id: article.id });
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingArticles?.length === 0 && (
              <p className="text-muted-foreground text-center">No pending articles to review</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="revisions">
          <div className="space-y-4">
            {(pendingRevisions as PendingRevision[] | undefined)?.map((revision) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/wiki/${revision.article.slug}/history`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Changes
                      </Link>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        approveRevisionMutation.mutate({ id: revision.id });
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        rejectRevisionMutation.mutate({ id: revision.id });
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingRevisions?.length === 0 && (
              <p className="text-muted-foreground text-center">No pending revisions to review</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 