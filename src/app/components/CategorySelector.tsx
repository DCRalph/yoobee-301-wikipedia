import { useState, useRef } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Category {
  name: string
  slug: string
}

const categories: Category[] = [
  { name: 'Arts & Culture', slug: 'arts' },
  { name: 'Literature', slug: 'literature' },
  { name: 'History', slug: 'history' },
  { name: 'Science', slug: 'science' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Geography', slug: 'geography' },
  { name: 'Mathematics', slug: 'mathematics' },
  { name: 'Philosophy', slug: 'philosophy' },
  { name: 'Religion', slug: 'religion' },
  { name: 'Society', slug: 'society' }
]

export default function CategorySelector() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(true)

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

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Left Shadow Overlay */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-24  z-10 pointer-events-none transition-opacity duration-300 ${showLeftShadow ? 'opacity-100' : 'opacity-0'
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
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="block min-w-[180px] border border-[#3b2a1a] bg-white p-4 text-center shadow-md transition-all duration-200 hover:bg-[#f8f5f1]"
            >
              <span className="font-medium text-[#3b2a1a]">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Right Shadow Overlay */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-24  z-10 pointer-events-none transition-opacity duration-300 ${showRightShadow ? 'opacity-100' : 'opacity-0'
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