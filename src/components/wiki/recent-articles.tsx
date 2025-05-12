"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { formatDistanceToNow } from "~/lib/date-utils";
import { User, Clock, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function RecentArticles() {
  const [mounted, setMounted] = useState(false);

  // Get published articles only
  const { data, isLoading } = api.user.articles.getAll.useQuery(
    { filterPublished: true, limit: 6 },
    { enabled: mounted },
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return <div>Loading recent articles...</div>;
  }

  if (!data?.articles || data.articles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No articles published yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.articles.map((article) => (
        <Card key={article.id} className="flex h-full flex-col">
          <CardHeader>
            <CardTitle className="line-clamp-2">
              <Link href={`/wiki/${article.slug}`} className="hover:underline">
                {article.title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-muted-foreground line-clamp-3">
              {article.content.replace(/<[^>]*>/g, "").slice(0, 150)}...
            </p>
            <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{article.author.name ?? "Anonymous"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(article.updatedAt))}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/wiki/${article.slug}`}>
                Read Article
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
