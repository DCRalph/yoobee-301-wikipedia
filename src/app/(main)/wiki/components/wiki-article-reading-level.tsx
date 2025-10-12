"use client";

import { BookOpen } from "lucide-react";
import { api } from "~/trpc/react";
import { useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";

interface WikiArticleReadingLevelProps {
  articleId: string;
  onContentChange: (content: string) => void;
}

type ReadingLevel = "original" | "novice" | "intermediate" | "advanced";

interface Summary {
  id: string;
  content: string;
  level: string;
  createdAt: Date;
  updatedAt: Date;
}

export function WikiArticleReadingLevel({
  articleId,
  onContentChange,
}: WikiArticleReadingLevelProps) {
  const [currentLevel, setCurrentLevel] = useState<ReadingLevel>("original");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Query for article summaries
  const { data: summaries, isLoading: isSummariesLoading } =
    api.summaries.getByArticleId.useQuery(
      { articleId },
      { enabled: !!articleId },
    );

  // Mutation for generating summaries
  const generateSummary = api.summaries.generate.useMutation({
    onSuccess: (data) => {
      if (data?.content) {
        setIsTransitioning(false);
        onContentChange(data.content);
      }
    },
  });

  // Define data for each reading level
  const levelMap: Record<
    ReadingLevel,
    { width: string; label: string; percent: number }
  > = {
    original: { width: "w-1/4", label: "Original", percent: 25 },
    novice: { width: "w-2/4", label: "Beginner", percent: 50 },
    intermediate: { width: "w-3/4", label: "Intermediate", percent: 75 },
    advanced: { width: "w-full", label: "Expert", percent: 100 },
  };

  // Handle level change
  const handleLevelChange = async (level: ReadingLevel) => {
    if (level === currentLevel) return;

    setCurrentLevel(level);
    setIsTransitioning(true);

    if (level === "original") {
      // Reset to original content
      const originalSummary = summaries?.find(
        (s: Summary) => s.level === "original",
      );
      if (originalSummary) {
        // Add a small delay to show the transition
        setTimeout(() => {
          setIsTransitioning(false);
          onContentChange(originalSummary.content);
        }, 300);
      }
      return;
    }

    // Check if we already have this summary
    const existingSummary = summaries?.find((s: Summary) => s.level === level);
    if (existingSummary) {
      // Add a small delay to show the transition
      setTimeout(() => {
        setIsTransitioning(false);
        onContentChange(existingSummary.content);
      }, 300);
      return;
    }

    // Generate new summary
    generateSummary.mutate({
      articleId,
      level,
    });
  };

  if (isSummariesLoading) {
    return <Skeleton className="mb-4 h-16 w-full sm:h-10" />;
  }

  const isLoading = generateSummary.isPending || isTransitioning;
  const level = levelMap[currentLevel];

  return (
    <div className="relative mb-4 rounded-md bg-[#f0e6d2] p-3 shadow-sm sm:p-4">
      {/* Header with icon and title */}
      <div className="mb-3 flex items-center gap-2 sm:mb-2">
        <div>
          <BookOpen className="h-4 w-4 text-[#5c3c10] sm:h-5 sm:w-5" />
        </div>
        <span className="text-sm font-medium text-[#5c3c10] sm:text-xs">
          Reading Level
        </span>
      </div>

      {/* Mobile Layout */}
      <div className="block space-y-3 sm:hidden">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="min-w-[60px] text-xs font-medium text-[#5c3c10]">
            {level.label}
          </span>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-[#d4bc8b]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={level.percent}
          >
            <div
              className="h-2 rounded-full bg-[#5c3c10] transition-all duration-300 ease-in-out"
              style={{ width: level.percent + "%" }}
            />
          </div>
        </div>

        {/* Level Buttons - 2x2 Grid on Mobile */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(levelMap).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleLevelChange(key as ReadingLevel)}
              disabled={isLoading}
              className={`rounded-md px-3 py-2 text-sm transition-all duration-200 ${
                currentLevel === key
                  ? "bg-[#5c3c10] font-semibold text-[#f0e6d2] shadow-md"
                  : "border border-[#d4bc8b] text-[#6b5c45] hover:bg-[#e8dcc0] hover:text-[#5c3c10]"
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center px-4">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#d4bc8b]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={level.percent}
          >
            <div
              className="h-1.5 rounded-full bg-[#5c3c10] transition-all duration-300 ease-in-out"
              style={{ width: level.percent + "%" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {Object.entries(levelMap).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleLevelChange(key as ReadingLevel)}
              disabled={isLoading}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                currentLevel === key
                  ? "bg-[#e8dcc0] font-semibold text-[#5c3c10] underline"
                  : "text-[#6b5c45] hover:bg-[#e8dcc0] hover:text-[#5c3c10]"
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-[#f0e6d2]/80 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5c3c10] border-t-transparent sm:h-6 sm:w-6" />
        </div>
      )}
    </div>
  );
}
