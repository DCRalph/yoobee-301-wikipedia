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
  <div className="rounded-lg border p-3 sm:p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <Skeleton className="h-6 w-2/3 sm:h-7" />
      <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:space-x-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
      <div className="flex items-center gap-1">
        <Skeleton className="h-4 w-4 flex-shrink-0 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-1">
        <Skeleton className="h-4 w-4 flex-shrink-0 rounded-full" />
        <Skeleton className="h-4 w-28 sm:w-36" />
      </div>
    </div>
    <div className="mt-4">
      <Skeleton className="h-9 w-full sm:w-32" />
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
        <div className="rounded-lg border p-4 text-center sm:p-8">
          <h3 className="text-lg font-medium">No articles found</h3>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
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
            className="hover:bg-muted/50 rounded-lg border p-3 transition-colors sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <Link
                href={`/wiki/${article.slug}`}
                className="block min-w-0 flex-1"
              >
                <h2 className="text-lg font-semibold break-words hover:underline sm:text-xl">
                  {article.title}
                </h2>
              </Link>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:space-y-0 sm:space-x-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  <span className="sm:inline">{article.viewCount}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-xs"
                >
                  <BarChart className="h-3 w-3" />
                  <span className="sm:inline">{article.dailyViews}</span>
                </Badge>
              </div>
            </div>
            <div className="text-muted-foreground mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {article.author.name ?? "Anonymous"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">
                  Updated {formatDistanceToNow(new Date(article.updatedAt))}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                asChild
              >
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
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Wiki Articles
          </h2>
        </div>
        {session?.user && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Button
              variant="outline"
              className="w-full text-sm sm:w-auto"
              asChild
            >
              <Link href="/wiki/pending">
                <ClipboardList className="mr-2 h-4 w-4" />
                <span className="sm:inline">Your Pending Edits</span>
              </Link>
            </Button>
            <Button className="w-full text-sm sm:w-auto" asChild>
              <Link href="/wiki/create">
                <FilePlus className="mr-2 h-4 w-4" />
                <span className="sm:inline">Create Article</span>
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
        searchPlaceholder="Search articles..."
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
