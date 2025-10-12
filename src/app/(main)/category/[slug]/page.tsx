"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  User,
  Calendar,
  Eye,
  SortAsc,
  ArrowRight,
} from "lucide-react";
import { type RouterOutputs } from "~/trpc/react";
import { use } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type Article =
  RouterOutputs["category"]["getArticlesBySlug"]["articles"][number];

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const ArticleCard = ({
  article,
  viewMode,
}: {
  article: Article;
  viewMode: "grid" | "list";
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  if (viewMode === "list") {
    return (
      <div className="flex gap-4 border border-[#d0c0a0] bg-white p-4 transition-shadow hover:shadow-md">
        {article.imageUrl && (
          <div className="flex-shrink-0">
            <Image
              src={article.imageUrl}
              alt={article.title}
              width={120}
              height={80}
              className="h-20 w-30 rounded object-cover"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col">
          <h3 className="mb-2 font-medium text-[#6b4c35]">{article.title}</h3>
          <p className="mb-3 line-clamp-2 flex-1 text-sm text-gray-600">
            {article.content.slice(0, 100)}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.author.name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(article.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.viewCount.toLocaleString()}
              </div>
            </div>
            <Link
              href={`/wiki/${article.slug}`}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#6b4c35] transition-colors hover:text-[#8b6c55] hover:underline"
            >
              Read More
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden border border-[#d0c0a0] bg-white transition-shadow hover:shadow-md">
      {article.imageUrl && (
        <div className="aspect-video overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            width={300}
            height={200}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 font-medium text-[#6b4c35]">{article.title}</h3>
        <p className="mb-3 line-clamp-3 flex-1 text-sm text-gray-600">
          {article.content.slice(0, 100)}
        </p>
        <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {article.author.name}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.viewCount.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {formatDate(article.createdAt)}
          </div>
          <Link
            href={`/wiki/${article.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#6b4c35] transition-colors hover:text-[#8b6c55] hover:underline"
          >
            Read More
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 border border-[#d0c0a0] bg-white px-3 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`border px-3 py-2 ${
            page === currentPage
              ? "border-[#6b4c35] bg-[#6b4c35] text-white"
              : "border-[#d0c0a0] bg-white hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 border border-[#d0c0a0] bg-white px-3 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function CategoryPage({ params }: CategoryPageProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "title">(
    "recent",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();

  const { slug } = use(params);

  const { data, isLoading, error } = api.category.getArticlesBySlug.useQuery({
    slug,
    page,
    limit: 12,
    sortBy,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Category Not Found
          </h1>
          <p className="mb-6 text-gray-600">
            {"The category you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#6b4c35] px-6 py-2 text-white transition-colors hover:bg-[#8b6c55]"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Show header and controls even when loading, but with loading content
  const category = data?.category;
  const articles = data?.articles ?? [];
  const pagination = data?.pagination;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link href="/" className="text-sm text-[#6b4c35] hover:underline">
            ← Back to Home
          </Link>
        </div>
        {!category ? (
          <>
            <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200"></div>
            <div className="mb-4 h-4 w-96 animate-pulse rounded bg-gray-200"></div>
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-3xl font-bold text-[#6b4c35]">
              {category.name}
            </h1>
            {category.description && (
              <p className="max-w-3xl text-gray-600">{category.description}</p>
            )}
            <div className="mt-4 text-sm text-gray-500">
              {isLoading ? (
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
              ) : (
                `${pagination?.totalCount} ${pagination?.totalCount === 1 ? "article" : "articles"} found`
              )}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="mb-6 rounded-lg border border-[#d0c0a0] bg-white p-4 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <SortAsc className="h-4 w-4" />
              <span className="font-medium">Sort by:</span>
            </div>
            <Select
              value={sortBy}
              onValueChange={(value: "recent" | "popular" | "title") => {
                setSortBy(value);
                setPage(1);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px] border-[#d0c0a0] focus:border-[#6b4c35] focus:ring-[#6b4c35]">
                <SelectValue placeholder="Select sorting option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="title">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">View:</span>
            <div className="flex gap-1 overflow-hidden rounded-md border border-[#d0c0a0]">
              <button
                onClick={() => setViewMode("grid")}
                disabled={isLoading}
                className={`p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  viewMode === "grid"
                    ? "bg-[#6b4c35] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                disabled={isLoading}
                className={`p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  viewMode === "list"
                    ? "bg-[#6b4c35] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#6b4c35]"></div>
            <p className="text-gray-600">Loading articles...</p>
          </div>
        </div>
      ) : articles.length > 0 ? (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                viewMode={viewMode}
              />
            ))}
          </div>

          <Pagination
            currentPage={pagination!.page}
            totalPages={pagination!.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="py-20 text-center">
          <h2 className="mb-4 text-xl font-medium text-gray-800">
            No Articles Found
          </h2>
          <p className="text-gray-600">
            There are no articles in this category yet. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
