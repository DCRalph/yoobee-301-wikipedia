"use client"

import { BookOpen } from "lucide-react"

interface WikiArticleReadingLevelProps {
  level?: "beginner" | "intermediate" | "advanced"
}

export function WikiArticleReadingLevel({ level = "intermediate" }: WikiArticleReadingLevelProps) {
  const getProgressWidth = () => {
    switch (level) {
      case "beginner":
        return "w-1/3"
      case "intermediate":
        return "w-2/3"
      case "advanced":
        return "w-full"
      default:
        return "w-2/3"
    }
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-[#f0e6d2] p-3 mb-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#5c3c10]" />
        <span className="text-xs font-medium text-[#5c3c10]">Reading Level</span>
      </div>
      <div className="flex flex-1 items-center px-4">
        <div className="h-1.5 w-full rounded-full bg-[#d4bc8b]">
          <div className={`h-1.5 ${getProgressWidth()} rounded-full bg-[#5c3c10]`}></div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${level === "beginner" ? "font-medium text-[#5c3c10]" : "text-[#6b5c45]"}`}>
          Beginner
        </span>
        <span className={`text-xs ${level === "intermediate" ? "font-medium text-[#5c3c10]" : "text-[#6b5c45]"}`}>
          Professional
        </span>
        <span className={`text-xs ${level === "advanced" ? "font-medium text-[#5c3c10]" : "text-[#6b5c45]"}`}>
          Expert
        </span>
      </div>
    </div>
  )
}
