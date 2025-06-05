"use client";

import { useState, useEffect } from "react";
import { Search, X, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
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

type SearchArticle = {
  id: string;
  title: string;
  slug: string;
  author: { name: string };
  updatedAt: Date;
  category: string;
  readTime: string;
  similarity?: number;
};

interface ArticleSelectorProps {
  label: string;
  placeholder: string;
  selectedArticle: SearchArticle | null;
  onSelect: (article: SearchArticle | null) => void;
  disabled?: boolean;
}

export function ArticleSelector({
  label,
  placeholder,
  selectedArticle,
  onSelect,
  disabled = false,
}: ArticleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use tRPC for search
  const { data, isLoading } = api.article.vectorSearch.useQuery(
    {
      searchTerm: debouncedSearchTerm,
      itemsPerPage: 5,
      searchType: "title",
      titleWeight: 0.3,
      contentWeight: 0.7,
    },
    {
      enabled: debouncedSearchTerm.length > 0 && isOpen,
    },
  ) as {
    data:
      | {
          articles: SearchArticle[];
          totalFound: number;
          executionTime: number;
        }
      | undefined;
    isLoading: boolean;
  };

  const handleSelect = (article: SearchArticle) => {
    onSelect(article);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onSelect(null);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium">{label}</label>

      {selectedArticle ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="text-primary h-4 w-4" />
                <div>
                  <h3 className="font-medium">{selectedArticle.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    by {selectedArticle.author.name}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-10"
              disabled={disabled}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setIsOpen(false);
                }}
                className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 transform p-0"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isOpen && searchTerm && (
            <Card className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto">
              <CardContent className="p-2">
                {isLoading && (
                  <div className="space-y-2">
                    {[...(Array(3) as unknown as number[])].map((_, i) => (
                      <div key={i} className="space-y-2 p-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && data?.articles && data.articles.length > 0 && (
                  <div className="space-y-1">
                    {data.articles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => handleSelect(article)}
                        className="hover:bg-muted w-full rounded-lg p-3 text-left transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="line-clamp-1 text-sm font-medium">
                              {article.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {article.category}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            by {article.author.name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!isLoading &&
                  debouncedSearchTerm &&
                  (!data?.articles || data.articles.length === 0) && (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        {`No articles found for "${debouncedSearchTerm}"`}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
