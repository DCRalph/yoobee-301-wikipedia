import { useState, useRef } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from "~/trpc/react"

export default function CategorySelector() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(true)

  // Fetch categories from tRPC
  const { data: categories, isLoading } = api.category.getAll.useQuery()

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftShadow(scrollLeft > 0)
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      const newScrollLeft = direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  const startDragging = (e: MouseEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      setIsDragging(true)
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
      setScrollLeft(scrollContainerRef.current.scrollLeft)
    }
  }

  const stopDragging = () => {
    setIsDragging(false)
  }

  const handleDrag = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    e.preventDefault()
    if (scrollContainerRef.current) {
      const x = e.pageX - scrollContainerRef.current.offsetLeft
      const walk = (x - startX) * 2
      scrollContainerRef.current.scrollLeft = scrollLeft - walk
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="relative mx-auto max-w-5xl">
        <div className="overflow-x-hidden mx-12">
          <div className="flex gap-3 w-max py-2">
            {/* Loading skeleton */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[180px] border border-[#3b2a1a] bg-gray-200 p-4 text-center animate-pulse"
              >
                <div className="h-6 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Filter to only show top-level categories and sort by name
  const topLevelCategories = categories?.filter(cat => !cat.parentId).sort((a, b) => a.name.localeCompare(b.name)) ?? []

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Left Shadow Overlay */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none transition-opacity duration-300 ${showLeftShadow ? 'opacity-100' : 'opacity-0'
          }`}
      />

      {/* Left Button */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center bg-[#3b2a1a] text-white hover:bg-[#4b3a2a] transition-all duration-200 ${showLeftShadow ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-hidden cursor-grab active:cursor-grabbing mx-12"
        onMouseDown={startDragging}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onMouseMove={handleDrag}
        onScroll={handleScroll}
      >
        <div className="flex gap-3 w-max py-2">
          {/* View All Categories Link */}
          <Link
            href="/category"
            className="block min-w-[180px] border-2 border-[#6b4c35] bg-[#6b4c35] p-4 text-center shadow-md transition-all duration-200 hover:bg-[#8b6c55] hover:border-[#8b6c55]"
          >
            <span className="font-medium text-white">
              View All Categories
            </span>
          </Link>

          {/* Category Links */}
          {topLevelCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="block min-w-[180px] border border-[#3b2a1a] bg-white p-4 text-center shadow-md transition-all duration-200 hover:bg-[#f8f5f1] group"
            >
              <span className="font-medium text-[#3b2a1a] group-hover:text-[#6b4c35]">
                {category.name}
              </span>
              {category._count && (
                <div className="text-xs text-gray-500 mt-1">
                  {category._count.articles} articles
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Right Shadow Overlay */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none transition-opacity duration-300 ${showRightShadow ? 'opacity-100' : 'opacity-0'
          }`}
      />

      {/* Right Button */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center bg-[#3b2a1a] text-white hover:bg-[#4b3a2a] transition-all duration-200 ${showRightShadow ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  )
} 