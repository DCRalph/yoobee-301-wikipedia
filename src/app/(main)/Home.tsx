"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import CategorySelector from "../components/CategorySelector";
import { api } from "~/trpc/react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
// CountUp animation component
const CountUp = ({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const step = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current ?? now);
      const progress = Math.min(elapsed / duration, 1);

      countRef.current = Math.floor(progress * end);
      setCount(countRef.current);

      if (progress < 1) {
        timerRef.current = setTimeout(step, 16); // roughly 60fps
      }
    };

    step();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// Article Card component to display articles
const ArticleCard = ({
  title,
  excerpt,
  readMoreUrl,
  darkMode = false,
}: {
  title: string;
  excerpt: string;
  readMoreUrl: string;
  darkMode?: boolean;
}) => (
  <div
    className={`group rounded-xl border-2 p-4 transition-all duration-300 hover:scale-105 active:scale-95 ${darkMode
      ? "border-[#8b6c55]/30 bg-linear-to-br from-[#6b4c35] to-[#3b2a1a] text-white shadow-xl hover:shadow-2xl"
      : "border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] shadow-lg hover:border-[#d4c4b0] hover:shadow-xl"
      }`}
  >
    <div className="space-y-3">
      <h4 className={`text-lg font-bold transition-colors duration-200 ${darkMode
        ? "text-[#f8f5f1] group-hover:text-white"
        : "text-[#3b2a1a] group-hover:text-[#6b4c35]"
        }`}>
        {title}
      </h4>

      <div className={`text-sm leading-relaxed ${darkMode ? "text-[#f8f5f1]/90" : "text-[#6b4c35]/80"
        }`}>
        <ReactMarkdown>{excerpt}</ReactMarkdown>
      </div>

      <div className={`mx-auto h-0.5 w-16 bg-linear-to-r from-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${darkMode
        ? "via-[#f8f5f1]"
        : "via-[#d4c4b0]"
        }`} />

      <div className="flex justify-end">
        <Link
          href={readMoreUrl}
          className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${darkMode
            ? "bg-linear-to-r from-[#8b6c55] to-[#6b4c35] text-[#f8f5f1] hover:from-[#a67c5a] hover:to-[#8b6c55]"
            : "bg-linear-to-r from-[#e8e0d6] to-[#d4c4b0] text-[#6b4c35] hover:from-[#d4c4b0] hover:to-[#c4b4a0]"
            }`}
        >
          Read more →
        </Link>
      </div>
    </div>
  </div>
);

// Section header component
const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-6 flex items-center justify-center">
    <div className="h-px w-12 bg-[#c0a080]"></div>
    <h2 className="mx-4 text-center font-serif text-2xl font-medium">
      {title}
    </h2>
    <div className="h-px w-12 bg-[#c0a080]"></div>
  </div>
);

export default function Home() {
  const { data: homeContent, isLoading } = api.home.getHomeContent.useQuery();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative h-[300px] overflow-hidden sm:h-[400px]">
        <div className="absolute inset-0">
          <Image
            src="/home/banner.png"
            alt="Library"
            width={1200}
            height={400}
            className="h-full w-full object-cover brightness-75"
            priority
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-end justify-center px-6 text-white sm:px-12">
          <h1 className="mb-2 font-serif text-3xl sm:text-4xl md:text-5xl">
            Welcome to WikiClone
          </h1>
          <p className="font-serif text-lg sm:text-xl md:text-2xl">
            the free encyclopedia
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto my-12 px-4">
        <SectionHeader title="Browse by Category" />
        <CategorySelector />
      </section>

      {/* News and Trending Section */}
      <section className="container mx-auto my-16 px-4">
        <SectionHeader title="Featured & Trending" />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#6b4c35]" />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-4 flex items-end justify-between border-b border-[#c0a080] pb-2 font-serif text-xl">
                  <span>Featured Articles</span>
                  {homeContent?.featured && homeContent.timings?.featured !== undefined && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {homeContent.featured.length} articles · {homeContent.timings.featured.toFixed(0)}ms
                    </span>
                  )}
                </h3>
                <div className="grid gap-4">
                  {homeContent?.featured && homeContent.featured.length > 0 ? (
                    homeContent.featured.slice(0, 2).map((article) => (
                      <div
                        key={article.id}
                        className="grid grid-cols-1 gap-4 md:grid-cols-3"
                      >
                        {article.imageUrl && (
                          <div className="overflow-hidden">
                            <Image
                              src={article.imageUrl}
                              alt={article.title}
                              width={300}
                              height={200}
                              className="h-[160px] w-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={`${article.imageUrl ? "md:col-span-2" : "col-span-full"}`}
                        >
                          <ArticleCard
                            title={article.title}
                            excerpt={article.excerpt}
                            readMoreUrl={article.readMoreUrl}
                            darkMode={true}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No featured articles available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-4 flex items-end justify-between border-b border-[#c0a080] pb-2 font-serif text-xl">
                  <span>Trending Now</span>
                  {homeContent?.trending && homeContent.timings?.trending !== undefined && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {homeContent.trending.length} articles · {homeContent.timings.trending.toFixed(0)}ms
                    </span>
                  )}
                </h3>
                <div className="grid gap-4">
                  {homeContent?.trending && homeContent.trending.length > 0 ? (
                    homeContent.trending.slice(0, 2).map((article) => (
                      <div
                        key={article.id}
                        className="grid grid-cols-1 gap-4 md:grid-cols-3"
                      >
                        <div
                          className={`${article.imageUrl ? "md:col-span-2" : "col-span-full"}`}
                        >
                          <ArticleCard
                            title={article.title}
                            excerpt={article.excerpt}
                            readMoreUrl={article.readMoreUrl}
                            darkMode={false}
                          />
                        </div>
                        {article.imageUrl && (
                          <div className="overflow-hidden">
                            <Image
                              src={article.imageUrl}
                              alt={article.title}
                              width={300}
                              height={200}
                              className="h-[160px] w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No trending articles available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Today's Article and On This Day Section */}
      <section className="container mx-auto my-16 px-4 pb-12">
        <SectionHeader title="Daily Content" />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#6b4c35]" />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Today's Article */}
              <div>
                <h3 className="mb-4 flex items-end justify-between border-b border-[#c0a080] pb-2 font-serif text-xl">
                  <span>Today&apos;s Article</span>
                  {homeContent?.daily?.todaysArticle && homeContent?.timings?.todaysArticle !== undefined && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {homeContent.timings.todaysArticle.toFixed(0)}ms
                    </span>
                  )}
                </h3>
                {homeContent?.daily?.todaysArticle ? (
                  <div className="grid grid-cols-1 gap-4">
                    {homeContent.daily.todaysArticle.imageUrl && (
                      <div className="overflow-hidden">
                        <Image
                          src={homeContent.daily.todaysArticle.imageUrl}
                          alt={homeContent.daily.todaysArticle.title}
                          width={600}
                          height={300}
                          className="h-[240px] w-full object-cover"
                        />
                      </div>
                    )}
                    <ArticleCard
                      title={homeContent.daily.todaysArticle.title}
                      excerpt={homeContent.daily.todaysArticle.excerpt}
                      readMoreUrl={homeContent.daily.todaysArticle.readMoreUrl}
                      darkMode={false}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No article of the day available
                    </p>
                  </div>
                )}
              </div>

              {/* On This Day */}
              <div>
                <h3 className="mb-4 border-b border-[#c0a080] pb-2 font-serif text-xl">
                  On This Day
                </h3>
                <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No historical events for today
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="container mx-auto my-16 px-4 pb-16">
        <div className="mb-6 flex items-center justify-center">
          <div className="h-px w-12 bg-[#c0a080]"></div>
          <div className="mx-4 text-center">
            <h2 className="font-serif text-2xl font-medium">
              WikiClone by the Numbers
            </h2>
            {homeContent?.timings?.stats !== undefined && (
              <p className="mt-1 text-xs text-muted-foreground">
                Stats loaded in {homeContent.timings.stats.toFixed(0)}ms
              </p>
            )}
          </div>
          <div className="h-px w-12 bg-[#c0a080]"></div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#6b4c35]" />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group flex flex-col items-center rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] hover:shadow-xl active:scale-95">
                <div className="mb-3 text-[#6b4c35] transition-colors duration-200 group-hover:text-[#3b2a1a]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-3xl font-bold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                  <CountUp end={homeContent?.stats?.totalUsers ?? 0} />
                </h3>
                <div className="inline-flex items-center rounded-full bg-linear-to-r from-[#e8e0d6] to-[#d4c4b0] px-3 py-1 text-xs font-medium text-[#6b4c35] transition-all duration-200 group-hover:from-[#d4c4b0] group-hover:to-[#c4b4a0]">
                  Contributors
                </div>
                {homeContent?.timings?.statTimings?.totalUsers !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {homeContent.timings.statTimings.totalUsers.toFixed(0)}ms
                  </p>
                )}
                <div className="mx-auto mt-2 h-0.5 w-12 bg-linear-to-r from-transparent via-[#d4c4b0] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </div>

              <div className="group flex flex-col items-center rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] hover:shadow-xl active:scale-95">
                <div className="mb-3 text-[#6b4c35] transition-colors duration-200 group-hover:text-[#3b2a1a]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-3xl font-bold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                  <CountUp end={homeContent?.stats?.totalCategories ?? 0} />
                </h3>
                <div className="inline-flex items-center rounded-full bg-linear-to-r from-[#e8e0d6] to-[#d4c4b0] px-3 py-1 text-xs font-medium text-[#6b4c35] transition-all duration-200 group-hover:from-[#d4c4b0] group-hover:to-[#c4b4a0]">
                  Categories
                </div>
                {homeContent?.timings?.statTimings?.totalCategories !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {homeContent.timings.statTimings.totalCategories.toFixed(0)}ms
                  </p>
                )}
                <div className="mx-auto mt-2 h-0.5 w-12 bg-linear-to-r from-transparent via-[#d4c4b0] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </div>

              <div className="group flex flex-col items-center rounded-xl border-2 border-[#e8e0d6] bg-linear-to-br from-white to-[#faf7f3] p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#d4c4b0] hover:shadow-xl active:scale-95">
                <div className="mb-3 text-[#6b4c35] transition-colors duration-200 group-hover:text-[#3b2a1a]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-3xl font-bold text-[#3b2a1a] transition-colors duration-200 group-hover:text-[#6b4c35]">
                  <CountUp end={homeContent?.stats?.dailyViews ?? 0} />
                </h3>
                <div className="inline-flex items-center rounded-full bg-linear-to-r from-[#e8e0d6] to-[#d4c4b0] px-3 py-1 text-xs font-medium text-[#6b4c35] transition-all duration-200 group-hover:from-[#d4c4b0] group-hover:to-[#c4b4a0]">
                  Daily Views
                </div>
                {homeContent?.timings?.statTimings?.dailyViews !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {homeContent.timings.statTimings.dailyViews.toFixed(0)}ms
                  </p>
                )}
                <div className="mx-auto mt-2 h-0.5 w-12 bg-linear-to-r from-transparent via-[#d4c4b0] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center rounded-full border-2 border-[#e8e0d6] bg-linear-to-r from-white to-[#faf7f3] px-6 py-3 shadow-lg transition-all duration-300 hover:shadow-xl">
                <p className="text-sm font-medium text-[#6b4c35]">
                  WikiClone is growing every day thanks to contributors like you!
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
