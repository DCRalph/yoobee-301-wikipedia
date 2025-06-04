"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "~/trpc/react";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";

export default function CategorySelector() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);

  const { data: categories, isLoading } = api.category.getAll.useQuery();

  // update shadows on native scroll
  const handleScroll = () => {
    console.log("handleScroll");
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    console.log(scrollLeft, scrollWidth, clientWidth);
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // scroll by buttons
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 400;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#f8f5f1] via-[#faf7f3] to-[#f8f5f1] p-6">
          <div className="flex w-max gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-24 min-w-[200px] animate-pulse rounded-xl bg-gradient-to-br from-[#e8e0d6] to-[#d4c4b0] shadow-lg"
              >
                <div className="space-y-2 p-4">
                  <div className="h-4 rounded-lg bg-[#c4b4a0]"></div>
                  <div className="h-3 w-3/4 rounded-lg bg-[#c4b4a0]"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topLevelCategories =
    categories
      ?.filter((cat) => !cat.parentId)
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  return (
    <div className="relative mx-auto max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#f8f5f1] via-[#faf7f3] to-[#f8f5f1] p-6 shadow-2xl">
        {/* Left Blur Gradient */}
        <div
          className={`pointer-events-none absolute top-0 bottom-0 left-0 z-30 w-32 transition-opacity ${
            showLeftShadow ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(to right, #f8f5f1, rgba(248,245,241,0.8), transparent)",
            maskImage:
              "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
          }}
        />

        {/* Left Button + Blur */}
        <div
          className={`absolute top-1/2 left-4 z-40 -translate-y-1/2 transition-all duration-300 ${
            showLeftShadow
              ? "translate-x-0 opacity-100"
              : "-translate-x-4 opacity-0"
          }`}
        >
          <div className="absolute bottom-0 left-1/2 z-0 h-4 w-12 -translate-x-1/2 rounded-full bg-black/20 blur-lg" />
          <Button
            onClick={() => scroll("left")}
            variant="ghost"
            className="relative z-10 flex h-14 w-14 items-center justify-center bg-gradient-to-br from-[#6b4c35] to-[#3b2a1a] text-[#f8f5f1] shadow-xl hover:scale-110 hover:text-[#f8f5f1] hover:shadow-2xl active:scale-95"
          >
            <ChevronLeft className="h-7 w-7" />
          </Button>
        </div>

        {/* Scrollable Area */}
        <ScrollArea className="py-2" onScroll={handleScroll} ref={scrollRef}>
          <div className="m-2 flex w-max gap-6">
            {/* "View All" Card */}
            <Link
              href="/category"
              className="group flex min-w-[220px] items-center justify-center rounded-xl border-2 border-[#8b6c55]/30 bg-gradient-to-br from-[#6b4c35] to-[#3b2a1a] p-3 text-center transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="space-y-2">
                <span className="block text-lg font-bold text-[#f8f5f1] transition-colors duration-200 group-hover:text-white">
                  View All Categories
                </span>
                <div className="inline-flex items-center rounded-full bg-gradient-to-r from-[#8b6c55] to-[#6b4c35] px-3 py-1 text-xs font-medium text-[#f8f5f1] transition-all duration-200 group-hover:from-[#a67c5a] group-hover:to-[#8b6c55]">
                  {topLevelCategories.length} categories
                </div>
                <div className="mx-auto h-0.5 w-16 bg-gradient-to-r from-transparent via-[#f8f5f1] to-transparent opacity-60 transition-opacity duration-200 group-hover:opacity-100" />
              </div>
            </Link>

            {/* Category Cards */}
            {topLevelCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group block min-w-[220px] rounded-xl border-2 border-[#e8e0d6] bg-gradient-to-br from-white to-[#faf7f3] p-3 text-center transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] active:scale-95"
              >
                <div className="space-y-3">
                  <span className="block text-lg font-bold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                    {category.name}
                  </span>
                  {category._count && (
                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-[#e8e0d6] to-[#d4c4b0] px-3 py-1 text-xs font-medium text-[#6b4c35] transition-all duration-200 group-hover:from-[#d4c4b0] group-hover:to-[#c4b4a0]">
                      {category._count.articles} articles
                    </div>
                  )}
                  <div className="mx-auto h-0.5 w-12 bg-gradient-to-r from-transparent via-[#d4c4b0] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Right Blur Gradient */}
        <div
          className={`\ pointer-events-none absolute top-0 right-0 bottom-0 z-30 w-32 transition-opacity ${
            showRightShadow ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(to left, #f8f5f1, rgba(248,245,241,0.8), transparent)",
            maskImage:
              "linear-gradient(to left, black 0%, black 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to left, black 0%, black 60%, transparent 100%)",
          }}
        />

        {/* Right Button + Blur */}
        <div
          className={`\ absolute top-1/2 right-4 z-40 -translate-y-1/2 transition-all duration-300 ${
            showRightShadow
              ? "translate-x-0 opacity-100"
              : "translate-x-4 opacity-0"
          }`}
        >
          <div className="absolute bottom-0 left-1/2 z-0 h-4 w-12 -translate-x-1/2 rounded-full bg-black/20 blur-lg" />
          <Button
            onClick={() => scroll("right")}
            className="relative z-10 flex h-14 w-14 items-center justify-center bg-gradient-to-br from-[#6b4c35] to-[#3b2a1a] text-[#f8f5f1] shadow-xl hover:scale-110 hover:text-[#f8f5f1] hover:shadow-2xl active:scale-95"
          >
            <ChevronRight className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </div>
  );
}
