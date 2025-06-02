"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { ChevronLeft, ChevronRight, Grid, List, User, Calendar, Eye, SortAsc } from "lucide-react";
import { type RouterOutputs } from "~/trpc/react";
import { use } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

type Article = RouterOutputs["category"]["getArticlesBySlug"]["articles"][number];

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const ArticleCard = ({ article, viewMode }: { article: Article; viewMode: 'grid' | 'list' }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 border border-[#d0c0a0] bg-white p-4 hover:shadow-md transition-shadow">
        {article.imageUrl && (
          <div className="flex-shrink-0">
            <Image
              src={article.imageUrl}
              alt={article.title}
              width={120}
              height={80}
              className="h-20 w-30 object-cover rounded"
            />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-medium text-[#6b4c35] hover:text-[#8b6c55] mb-2">
            <Link href={`/wiki/${article.slug}`}>
              {article.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {article.content.slice(0, 100)}
          </p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#d0c0a0] bg-white hover:shadow-md transition-shadow overflow-hidden">
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
      <div className="p-4">
        <h3 className="font-medium text-[#6b4c35] hover:text-[#8b6c55] mb-2">
          <Link href={`/wiki/${article.slug}`}>
            {article.title}
          </Link>
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
          {article.content.slice(0, 100)}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
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
        <div className="mt-2 text-xs text-gray-400">
          {formatDate(article.createdAt)}
        </div>
      </div>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange
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
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 px-3 py-2 border border-[#d0c0a0] bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 border ${page === currentPage
            ? 'bg-[#6b4c35] text-white border-[#6b4c35]'
            : 'bg-white border-[#d0c0a0] hover:bg-gray-50'
            }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 px-3 py-2 border border-[#d0c0a0] bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function CategoryPage({ params }: CategoryPageProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'title'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();

  const { slug } = use(params);

  const { data, isLoading, error } = api.category.getArticlesBySlug.useQuery({
    slug,
    page,
    limit: 12,
    sortBy
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">{"The category you're looking for doesn't exist."}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[#6b4c35] text-white hover:bg-[#8b6c55] transition-colors"
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
          <Link href="/" className="text-[#6b4c35] hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
        {!category ? (
          <>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-96"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-[#6b4c35] mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-gray-600 max-w-3xl">{category.description}</p>
            )}
            <div className="mt-4 text-sm text-gray-500">
              {isLoading ? (
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              ) : (
                `${pagination?.totalCount} ${pagination?.totalCount === 1 ? 'article' : 'articles'} found`
              )}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white border border-[#d0c0a0] rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <SortAsc className="h-4 w-4" />
              <span className="font-medium">Sort by:</span>
            </div>
            <Select
              value={sortBy}
              onValueChange={(value: 'recent' | 'popular' | 'title') => {
                setSortBy(value);
                setPage(1);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px] border-[#d0c0a0] focus:ring-[#6b4c35] focus:border-[#6b4c35]">
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
            <span className="text-sm text-gray-600 font-medium">View:</span>
            <div className="flex gap-1 border border-[#d0c0a0] rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                disabled={isLoading}
                className={`p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
                  ? 'bg-[#6b4c35] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                disabled={isLoading}
                className={`p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'list'
                  ? 'bg-[#6b4c35] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
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
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#6b4c35] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading articles...</p>
          </div>
        </div>
      ) : articles.length > 0 ? (
        <>
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} viewMode={viewMode} />
            ))}
          </div>

          <Pagination
            currentPage={pagination!.page}
            totalPages={pagination!.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-xl font-medium text-gray-800 mb-4">No Articles Found</h2>
          <p className="text-gray-600">
            There are no articles in this category yet. Check back later!
          </p>
        </div>
      )}
    </div>
  );
} 