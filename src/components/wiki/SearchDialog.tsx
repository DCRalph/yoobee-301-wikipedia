"use client";

import { useState, useEffect } from "react";
import { Search, X, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/use-debounce";
import { formatDistanceToNow } from "~/lib/date-utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { RouterOutputs } from "~/trpc/react";

type SearchArticle =
  RouterOutputs["user"]["articles"]["searchArticles"]["articles"][number];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data, isLoading } = api.user.articles.searchArticles.useQuery(
    { searchTerm: debouncedSearchTerm, limit: 10 },
    {
      enabled: debouncedSearchTerm.length > 0,
    },
  );

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hover:text-foreground flex items-center gap-2 text-sm"
        aria-label="Search articles"
      >
        <Search className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <VisuallyHidden>
            <DialogTitle>Search Articles</DialogTitle>
          </VisuallyHidden>
          <DialogHeader className="px-2">
            <div className="relative flex items-center">
              <Search className="text-muted-foreground absolute left-3 h-4 w-4" />
              <Input
                id="search-input"
                placeholder="Search articles..."
                className="pr-9 pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3"
                  aria-label="Clear search"
                >
                  <X className="text-muted-foreground h-4 w-4" />
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="mt-2 max-h-[60vh] overflow-y-auto p-2">
            {isLoading && debouncedSearchTerm.length > 0 && (
              <div className="flex justify-center p-4">
                <p>Searching...</p>
              </div>
            )}

            {!isLoading &&
              debouncedSearchTerm.length > 0 &&
              data?.articles.length === 0 && (
                <div className="flex flex-col items-center justify-center p-4">
                  <p className="text-muted-foreground text-center">
                    {`No articles found for "${debouncedSearchTerm}"`}
                  </p>
                </div>
              )}

            {!isLoading && data?.articles && data.articles.length > 0 && (
              <div className="space-y-2">
                {data.articles.map((article: SearchArticle) => (
                  <div
                    key={article.id}
                    className="hover:bg-muted/50 rounded-lg border p-3 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <Link href={`/wiki/${article.slug}`} className="block">
                      <h3 className="font-medium">{article.title}</h3>
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                        <span>{article.author.name ?? "Anonymous"}</span>
                        <span>•</span>
                        <span>
                          Updated{" "}
                          {formatDistanceToNow(new Date(article.updatedAt))}
                        </span>
                      </div>
                    </Link>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/wiki/${article.slug}`}>
                          <BookOpen className="mr-2 h-3 w-3" />
                          Read Article
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!debouncedSearchTerm && (
              <div className="flex flex-col items-center justify-center p-4">
                <p className="text-muted-foreground text-center">
                  Start typing to search articles
                </p>
                <div className="text-muted-foreground mt-2 text-xs">
                  <span className="mx-1 rounded border px-1 py-0.5">Ctrl</span>
                  <span>+</span>
                  <span className="mx-1 rounded border px-1 py-0.5">K</span>
                  <span>to open search</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
