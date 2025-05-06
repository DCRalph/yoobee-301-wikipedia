"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatDistanceToNow } from "~/lib/date-utils";
import { Search, BookText, User, Clock } from "lucide-react";

export function WikiArticleList() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get published articles only
  const { data, isLoading } = api.articles.getAll.useQuery(
    { filterPublished: true, limit: 100 },
    { enabled: mounted },
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter articles based on search term
  const filteredArticles = data?.articles.filter((article) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.slug.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return <div>Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-md">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {filteredArticles && filteredArticles.length > 0 ? (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
            >
              <Link href={`/wiki/${article.slug}`} className="block">
                <h2 className="text-xl font-semibold hover:underline">
                  {article.title}
                </h2>
              </Link>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{article.author.name ?? "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Updated {formatDistanceToNow(new Date(article.updatedAt))}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/wiki/${article.slug}`}>
                    <BookText className="mr-2 h-4 w-4" />
                    Read Article
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <h3 className="text-lg font-medium">No articles found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm
              ? "Try a different search term."
              : "There are no published articles yet."}
          </p>
        </div>
      )}
    </div>
  );
}
