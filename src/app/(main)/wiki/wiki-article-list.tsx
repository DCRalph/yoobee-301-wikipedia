"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { formatDistanceToNow } from "~/lib/date-utils";
import {
  User,
  Clock,
  FilePlus,
  BookOpen,
  ClipboardList,
  Eye,
  BarChart,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge } from "~/components/ui/badge";
import {
  PaginatedSearchList,
  type PaginatedSearchListRef,
  type SortOption,
} from "~/components/PaginatedSearchList";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "~/components/ui/skeleton";

// Loading skeleton for article cards
const ArticleCardSkeleton = () => (
  <div className="rounded-lg border p-4">
    <div className="flex justify-between">
      <Skeleton className="h-7 w-2/3" />
      <div className="flex space-x-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-1">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-1">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
    <div className="mt-4">
      <Skeleton className="h-9 w-32" />
    </div>
  </div>
);

export function WikiArticleList() {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const searchListRef = useRef<PaginatedSearchListRef>(null);

  // Default search parameters
  const initialSearch = searchParams?.get("q") ?? "";
  const initialPage = parseInt(searchParams?.get("page") ?? "1", 10);
  const initialSortField = searchParams?.get("sortField") ?? "dailyViews";
  const initialSortDir = searchParams?.get("sortDir") ?? "desc";

  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState(initialSortField);
  const [limit] = useState(10);
  const [searchTimeMs, setSearchTimeMs] = useState<number | undefined>(
    undefined,
  );
  const [queryStartTime, setQueryStartTime] = useState<number | null>(null);

  // Sort options for articles
  const sortOptions: SortOption[] = [
    { field: "updatedAt", direction: "desc", label: "Last Updated" },
    { field: "viewCount", direction: "desc", label: "Most Views" },
    { field: "dailyViews", direction: "desc", label: "Views Today" },
  ];

  // Find initial sort option
  const initialSort = sortOptions.find(
    (opt) => opt.field === initialSortField && opt.direction === initialSortDir,
  );

  // Query for articles with search, pagination, and sorting
  const { data, isLoading } = api.user.articles.getAll.useQuery(
    {
      limit,
      page: currentPage,
      sortBy: sortBy as "updatedAt" | "viewCount" | "dailyViews",
      searchTerm,
      vectorSearch: true,
      vectorSearchType: "title",
      titleWeight: 0.3,
      contentWeight: 0.7,
    },
    { enabled: mounted },
  );

  // Track timing when query completes
  useEffect(() => {
    if (!isLoading && queryStartTime !== null) {
      const endTime = performance.now();
      const duration = Math.round(endTime - queryStartTime);
      setSearchTimeMs(duration);
      setQueryStartTime(null);
    }
  }, [isLoading, queryStartTime]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handler for search
  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page on search
    setQueryStartTime(performance.now()); // Start timing
    setSearchTimeMs(undefined); // Clear previous timing
  };

  // Handler for page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setQueryStartTime(performance.now()); // Start timing
    setSearchTimeMs(undefined); // Clear previous timing
  };

  // Handler for sort changes
  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort.field);
    setQueryStartTime(performance.now()); // Start timing
    setSearchTimeMs(undefined); // Clear previous timing
  };

  // Render function for content based on loading state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: limit }).map((_, index) => (
            <ArticleCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      );
    }

    if (!data?.articles || data.articles.length === 0) {
      return (
        <div className="rounded-lg border p-8 text-center">
          <h3 className="text-lg font-medium">No articles found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm
              ? "Try a different search term."
              : "There are no published articles yet."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.articles.map((article) => (
          <div
            key={article.id}
            className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
          >
            <div className="flex justify-between">
              <Link href={`/wiki/${article.slug}`} className="block">
                <h2 className="text-xl font-semibold hover:underline">
                  {article.title}
                </h2>
              </Link>
              <div className="flex space-x-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.viewCount}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <BarChart className="h-3 w-3" />
                  {article.dailyViews}
                </Badge>
              </div>
            </div>
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
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Article
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Wiki Articles</h2>
        </div>
        {session?.user && (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/wiki/pending">
                <ClipboardList className="mr-2 h-4 w-4" />
                Your Pending Edits
              </Link>
            </Button>
            <Button asChild>
              <Link href="/wiki/create">
                <FilePlus className="mr-2 h-4 w-4" />
                Create Article
              </Link>
            </Button>
          </div>
        )}
      </div>

      <PaginatedSearchList
        ref={searchListRef}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        pagination={{
          total: data?.pagination.total ?? 0,
          page: currentPage,
          limit,
          totalPages: data?.pagination.totalPages ?? 1,
        }}
        searchPlaceholder="Search articles by title or content..."
        isLoading={isLoading}
        initialSearchValue={initialSearch}
        sortOptions={sortOptions}
        initialSort={initialSort}
        searchTimeMs={searchTimeMs}
      >
        {renderContent()}
      </PaginatedSearchList>
    </div>
  );
}

// Export a wrapped version with Suspense
export default function WikiArticleListWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <ArticleCardSkeleton />
        </div>
      }
    >
      <WikiArticleList />
    </Suspense>
  );
}
