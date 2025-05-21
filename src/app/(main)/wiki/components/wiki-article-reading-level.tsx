"use client";

import { BookOpen } from "lucide-react";
import { api } from "~/trpc/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const { data: summaries, isLoading: isSummariesLoading } = api.summaries.getByArticleId.useQuery(
    { articleId },
    { enabled: !!articleId }
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
      const originalSummary = summaries?.find((s: Summary) => s.level === "original");
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
    return <Skeleton className="h-10 w-full mb-4" />;
  }

  const isLoading = generateSummary.isPending || isTransitioning;
  const level = levelMap[currentLevel];

  return (
    <div className="flex items-center justify-between rounded-md bg-[#f0e6d2] p-3 mb-4 shadow-sm">
      <div className="flex items-center gap-2">
        <motion.div
          animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
        >
          <BookOpen className="h-4 w-4 text-[#5c3c10]" />
        </motion.div>
        <span className="text-xs font-medium text-[#5c3c10]">
          Reading Level
        </span>
      </div>
      <div className="flex flex-1 items-center px-4">
        <div
          className="h-1.5 w-full rounded-full bg-[#d4bc8b] overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={level.percent}
        >
          <motion.div
            className="h-1.5 rounded-full bg-[#5c3c10]"
            initial={{ width: "0%" }}
            animate={{
              width: level.percent + '%',
              transition: { duration: 0.3, ease: "easeInOut" }
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {Object.entries(levelMap).map(([key, value]) => (
          <motion.button
            key={key}
            onClick={() => handleLevelChange(key as ReadingLevel)}
            disabled={isLoading}
            className={`text-xs transition-colors ${currentLevel === key
              ? "font-semibold underline text-[#5c3c10]"
              : "text-[#6b5c45] hover:text-[#5c3c10]"
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={currentLevel === key ? {
              scale: [1, 1.05, 1],
              transition: { duration: 0.3 }
            } : {}}
          >
            {value.label}
          </motion.button>
        ))}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#f0e6d2]/50 backdrop-blur-sm rounded-md flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-6 h-6 border-2 border-[#5c3c10] border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
