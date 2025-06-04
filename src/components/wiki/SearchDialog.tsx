"use client";

import { useState, useEffect } from "react";
import { Search, X, BookOpen, Clock, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import { api } from "~/trpc/react";

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Format time distance
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Format execution time
const formatExecutionTime = (ms: number) => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms.toFixed(0)}ms`;
};

type SearchArticle = {
  id: string;
  title: string;
  slug: string;
  author: { name: string };
  updatedAt: Date;
  category: string;
  readTime: string;
  similarity?: number;
  distance?: number;
};

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use tRPC for search
  const { data, isLoading } = api.article.vectorSearch.useQuery(
    {
      searchTerm: debouncedSearchTerm,
      itemsPerPage: 10,
      searchType: "title",
      titleWeight: 0.3,
      contentWeight: 0.7,
    },
    {
      enabled: debouncedSearchTerm.length > 0,
    },
  ) as {
    data:
      | {
          articles: SearchArticle[];
          totalFound: number;
          executionTime: number;
          searchType: string;
          page: number;
          itemsPerPage: number;
          totalPages: number;
        }
      | undefined;
    isLoading: boolean;
  };

  // Focus the input when the dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        document.getElementById("search-input")?.focus();
      }, 100);
    } else {
      // Clear search when dialog closes
      setSearchTerm("");
    }
  }, [open]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open on Ctrl+K or Command+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }

      // Close on escape
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const SearchResultSkeleton = () => (
    <div className="space-y-3">
      {[...(Array(3) as number[])].map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border p-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="group relative h-9 w-9 p-0 xl:h-10 xl:w-56 xl:justify-start xl:px-3 xl:py-2"
      >
        <Search className="size-6 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search articles...</span>
        <kbd className="bg-primary group-hover:text-primary-foreground text-primary-foreground pointer-events-none absolute top-2 right-1.5 hidden h-6 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-[650px]" noClose>
          {/* Search Header */}
          <DialogHeader className="border-b px-6 py-4">
            <div className="relative flex items-center">
              <Search className="text-muted-foreground absolute left-3 h-4 w-4" />
              <Input
                id="search-input"
                placeholder="Search articles, topics, or authors..."
                className="h-11 border-0 pr-10 pl-10 text-base shadow-none focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1 h-8 w-8 p-0"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Loading State */}
            {isLoading && debouncedSearchTerm.length > 0 && (
              <div className="p-6">
                <SearchResultSkeleton />
              </div>
            )}

            {/* No Results */}
            {!isLoading &&
              debouncedSearchTerm.length > 0 &&
              (!data?.articles || data.articles.length === 0) && (
                <div className="flex flex-col items-center justify-center px-6 py-12">
                  <div className="bg-muted mb-4 rounded-full p-3">
                    <Search className="text-muted-foreground h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    No articles found
                  </h3>
                  <p className="text-muted-foreground max-w-sm text-center">
                    {`We couldn't find any articles matching "${debouncedSearchTerm}". Try adjusting your search terms.`}
                  </p>
                </div>
              )}

            {/* Search Results */}
            {!isLoading && data?.articles && data.articles.length > 0 && (
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    Found {data.totalFound} article
                    {data.totalFound !== 1 ? "s" : ""} in{" "}
                    {formatExecutionTime(data.executionTime)}
                  </p>
                </div>

                <div className="space-y-3">
                  {data.articles.map((article: SearchArticle) => (
                    <div
                      key={article.id}
                      className="group bg-card hover:bg-accent/50 rounded-xl border p-4 transition-all hover:shadow-md"
                    >
                      <Link
                        href={`/wiki/${article.slug}`}
                        className="block space-y-3"
                        onClick={() => setOpen(false)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="group-hover:text-primary text-base leading-tight font-semibold transition-colors">
                              {article.title}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-xs"
                            >
                              {article.category}
                            </Badge>
                          </div>

                          <div className="text-muted-foreground flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{article.author.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(article.updatedAt)}
                              </span>
                            </div>
                            <span>{article.readTime}</span>
                            {article.similarity && (
                              <span className="text-xs">
                                {Math.round(article.similarity * 100)}% match
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:bg-primary group-hover:text-primary-foreground h-8 text-xs transition-colors"
                          >
                            <BookOpen className="mr-1.5 h-3 w-3" />
                            Read Article
                          </Button>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!debouncedSearchTerm && (
              <div className="flex flex-col items-center justify-center px-6 py-12">
                <div className="bg-muted mb-4 rounded-full p-4">
                  <Search className="text-muted-foreground h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  Search our knowledge base
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm text-center">
                  Find articles, tutorials, and guides to help you get started.
                </p>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <kbd className="bg-muted pointer-events-none inline-flex h-6 items-center gap-1 rounded border px-2 font-mono text-xs font-medium select-none">
                    <span>⌘</span>K
                  </kbd>
                  <span>to open • </span>
                  <kbd className="bg-muted pointer-events-none inline-flex h-6 items-center gap-1 rounded border px-2 font-mono text-xs font-medium select-none">
                    Esc
                  </kbd>
                  <span>to close</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
