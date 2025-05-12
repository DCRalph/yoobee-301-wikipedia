"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { AlertCircle, ArrowLeft, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function PendingReviewContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<string>("articles");
  const isLoading = status === "loading";

  // Fetch pending review items
  const {
    data,
    error,
    isLoading: isPendingLoading,
  } = api.user.articles.getPendingReview.useQuery(undefined, {
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/wiki">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wiki
              </Link>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">
              Your Pending Contributions
            </h2>
          </div>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/wiki">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wiki
              </Link>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">
              Your Pending Contributions
            </h2>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to view your pending contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to view your pending contributions.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/api/auth/signin")}>
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/wiki">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Wiki
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            Your Pending Contributions
          </h2>
        </div>
        <Button variant="outline" asChild>
          <Link href="/wiki/create">Create New Article</Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message ||
              "An error occurred while fetching your pending contributions"}
          </AlertDescription>
        </Alert>
      )}

      {isPendingLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p>Loading your contributions...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="articles">
              Pending Articles ({data?.articles.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="revisions">
              Pending Revisions ({data?.revisions.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles">
            {data?.articles.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    {"You don't have any articles pending review."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {data?.articles.map((article) => (
                  <Card key={article.id}>
                    <CardHeader>
                      <CardTitle>{article.title}</CardTitle>
                      <CardDescription>
                        Pending since{" "}
                        {formatDistanceToNow(new Date(article.createdAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-muted-foreground mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Submitted:{" "}
                          {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">
                        {article.content.substring(0, 150)}
                        {article.content.length > 150 ? "..." : ""}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <div className="text-muted-foreground text-sm">
                        Status:{" "}
                        <span className="font-medium text-amber-600">
                          Under Review
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="revisions">
            {data?.revisions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    {"You don't have any revisions pending review."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {data?.revisions.map((revision) => (
                  <Card key={revision.id}>
                    <CardHeader>
                      <CardTitle>
                        Revision for: {revision.article.title}
                      </CardTitle>
                      <CardDescription>
                        Pending since{" "}
                        {formatDistanceToNow(new Date(revision.createdAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-muted-foreground mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Submitted:{" "}
                          {new Date(revision.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">
                        {revision.content.substring(0, 150)}
                        {revision.content.length > 150 ? "..." : ""}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <div className="flex w-full items-center justify-between">
                        <div className="text-muted-foreground text-sm">
                          Status:{" "}
                          <span className="font-medium text-amber-600">
                            Under Review
                          </span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/wiki/${revision.article.slug}`}>
                            View Original Article
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
