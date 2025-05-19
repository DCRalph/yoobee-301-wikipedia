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
    <div className="flex items-center justify-between rounded-md bg-gray-100 p-2">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4" />
        <span className="text-xs font-medium">Reading Level</span>
      </div>
      <div className="flex flex-1 items-center px-4">
        <div className="h-1 w-full rounded-full bg-gray-300">
          <div className={`h-1 ${getProgressWidth()} rounded-full bg-blue-600`}></div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${level === "beginner" ? "font-medium" : ""}`}>Beginner</span>
        <span className={`text-xs ${level === "intermediate" ? "font-medium" : ""}`}>Intermediate</span>
        <span className={`text-xs ${level === "advanced" ? "font-medium" : ""}`}>Advanced</span>
      </div>
    </div>
  )
}
