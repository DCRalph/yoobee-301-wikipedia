"use client";

import { api } from "~/trpc/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock, User, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "~/lib/date-utils";
import { Skeleton } from "~/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

interface SimilarArticlesProps {
  articleId: string;
  maxItems?: number;
  searchType?: "title" | "content" | "hybrid";
  titleWeight?: number;
  contentWeight?: number;
}

export function SimilarArticles({
  articleId,
  maxItems = 5,
  searchType = "title",
  titleWeight = 0.3,
  contentWeight = 0.7,
}: SimilarArticlesProps) {
  const { data, isLoading, error } = api.article.getSimilarArticles.useQuery({
    articleId,
    itemsPerPage: maxItems,
    maxDistance: 1.0,
    searchType,
    titleWeight,
    contentWeight,
  });

  if (error) {
    return null; // Silently fail to not disrupt the main article display
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#5c3c10]" />
          <h3 className="font-serif text-xl font-bold text-[#3a2a14]">
            Similar Articles
          </h3>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-3/4 bg-[#e8dcc3]" />
              <Skeleton className="h-4 w-full bg-[#e8dcc3]" />
              <Skeleton className="h-4 w-1/2 bg-[#e8dcc3]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.articles || data.articles.length === 0) {
    return null; // Don't show section if no similar articles found
  }

  const getSearchTypeLabel = (type: string) => {
    switch (type) {
      case "title":
        return "by title similarity";
      case "content":
        return "by content similarity";
      case "hybrid":
        return "by title & content similarity";
      default:
        return "by similarity";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      className="mt-8 w-full rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-2 shadow-sm lg:p-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#5c3c10]" />
        <div className="flex-1">
          <h3 className="font-serif text-xl font-bold text-[#3a2a14]">
            Similar Articles
          </h3>
          <p className="text-sm text-[#8b7a5e]">
            Found {getSearchTypeLabel(data.searchType || searchType)}
          </p>
        </div>
        <Badge variant="outline" className="border-[#d4bc8b] text-[#5c3c10]">
          {data.articles.length} found
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data.articles.map((article) => (
          <motion.div key={article.id} variants={itemVariants}>
            <Card className="group border-[#d4bc8b] bg-[#fefcf6] transition-all duration-200 hover:border-[#5c3c10] hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 font-serif text-base text-[#3a2a14]">
                    {article.title}
                  </CardTitle>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Badge
                      variant="secondary"
                      className="bg-[#e8dcc3] text-xs text-[#5c3c10]"
                    >
                      {Math.round(article.similarity * 100)}% match
                    </Badge>
                    {/* Show specific distance scores for hybrid mode */}
                    {data.searchType === "hybrid" &&
                      article.titleDistance &&
                      article.contentDistance && (
                        <div className="text-xs text-[#8b7a5e]">
                          <div>
                            Title:{" "}
                            {Math.round((1 - article.titleDistance) * 100)}%
                          </div>
                          <div>
                            Content:{" "}
                            {Math.round((1 - article.contentDistance) * 100)}%
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 line-clamp-2 text-sm text-[#605244]">
                  <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>

                <div className="mb-3 flex items-center justify-between text-xs text-[#5c3c10]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{article.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3 text-xs text-[#8b7a5e]">
                  Updated {formatDistanceToNow(new Date(article.updatedAt))}
                </div>

                <div className="flex justify-end">
                  <Link
                    href={`/wiki/${article.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#5c3c10] transition-colors hover:text-[#3a2a14] hover:underline"
                  >
                    Read More
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {data.executionTime && (
        <div className="mt-4 text-center text-xs text-[#8b7a5e]">
          Found in {data.executionTime}ms using AI similarity matching
        </div>
      )}
    </motion.div>
  );
}
