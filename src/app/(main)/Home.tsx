"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import CategorySelector from "../components/CategorySelector";
import { api } from "~/trpc/react";

// Type for HomeContent API response
type HomeContent = {
  featured: Array<{
    id: string;
    title: string;
    excerpt: string;
    imageUrl?: string;
    category: string;
    readMoreUrl: string;
  }>;
  trending: Array<{
    id: string;
    title: string;
    excerpt: string;
    imageUrl?: string;
    category: string;
    readMoreUrl: string;
  }>;
  daily: {
    todaysArticle?: {
      id: string;
      title: string;
      excerpt: string;
      imageUrl?: string;
      readMoreUrl: string;
    };
    onThisDay?: {
      id: string;
      title: string;
      excerpt: string;
      imageUrl?: string;
      readMoreUrl: string;
      items: Array<{
        id: string;
        year: number;
        text: string;
        readMoreUrl?: string;
      }>;
    };
  };
  stats?: {
    totalArticles: number;
    totalUsers: number;
    totalCategories: number;
    dailyViews: number;
  };
};

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
    className={`p-4 ${darkMode ? "bg-[#6b4c35] text-white" : "border border-[#d0c0a0] bg-white"}`}
  >
    <h4 className="mb-2 font-medium">{title}</h4>
    <p className="line-clamp-3 text-sm">{excerpt}</p>
    <div className="mt-4 text-right">
      <Link
        href={readMoreUrl}
        className={`${darkMode ? "text-white" : "text-[#6b4c35]"} hover:underline`}
      >
        Read more
      </Link>
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
  const { data: session } = useSession();
  const { data: homeContent, isLoading } = api.home.getHomeContent.useQuery();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative h-[300px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/home/banner.png"
            alt="Library"
            width={1200}
            height={300}
            className="h-full w-full object-cover brightness-75"
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-end justify-center px-12 text-white">
          <h1 className="mb-2 font-serif text-4xl md:text-5xl">
            Welcome to Wikipedia
          </h1>
          <p className="font-serif text-xl md:text-2xl">
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
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#6b4c35]"></div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-4 border-b border-[#c0a080] pb-2 font-serif text-xl">
                  Featured Articles
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
                    <p className="text-center text-gray-500">
                      No featured articles available
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-4 border-b border-[#c0a080] pb-2 font-serif text-xl">
                  Trending Now
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
                    <p className="text-center text-gray-500">
                      No trending articles available
                    </p>
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
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#6b4c35]"></div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Today's Article */}
              <div>
                <h3 className="mb-4 border-b border-[#c0a080] pb-2 font-serif text-xl">
                  {"Today's Article"}
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
                  <p className="text-center text-gray-500">
                    No article of the day available
                  </p>
                )}
              </div>

              {/* On This Day */}
              <div>
                <h3 className="mb-4 border-b border-[#c0a080] pb-2 font-serif text-xl">
                  On This Day
                </h3>
                {homeContent?.daily?.onThisDay ? (
                  <div className="grid grid-cols-1 gap-4">
                    {homeContent.daily.onThisDay.imageUrl && (
                      <div className="overflow-hidden">
                        <Image
                          src={homeContent.daily.onThisDay.imageUrl}
                          alt={homeContent.daily.onThisDay.title}
                          width={600}
                          height={300}
                          className="h-[240px] w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      {homeContent.daily.onThisDay.items.map((item, index) => (
                        <div
                          key={item.id}
                          className={
                            index % 2 === 0
                              ? "border border-[#d0c0a0] bg-white p-4"
                              : "bg-[#6b4c35] p-4 text-white"
                          }
                        >
                          <h4 className="mb-2 font-medium">{item.year}</h4>
                          <p className="text-sm">{item.text}</p>
                          {item.readMoreUrl && (
                            <div className="mt-4 text-right">
                              <Link
                                href={item.readMoreUrl}
                                className={
                                  index % 2 === 0
                                    ? "text-[#6b4c35] hover:underline"
                                    : "text-white hover:underline"
                                }
                              >
                                Read more
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    No historical events for today
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="container mx-auto my-16 px-4 pb-16">
        <SectionHeader title="Wikipedia by the Numbers" />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#6b4c35]"></div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center rounded-lg border border-[#d0c0a0] bg-white p-6 shadow-sm">
                <div className="mb-3 text-[#6b4c35]">
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
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-3xl font-bold">
                  <CountUp end={homeContent?.stats?.totalArticles ?? 0} />
                </h3>
                <p className="text-center text-sm text-gray-600">
                  Articles Published
                </p>
              </div>

              <div className="flex flex-col items-center rounded-lg border border-[#d0c0a0] bg-white p-6 shadow-sm">
                <div className="mb-3 text-[#6b4c35]">
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
                <h3 className="mb-2 text-3xl font-bold">
                  <CountUp end={homeContent?.stats?.totalUsers ?? 0} />
                </h3>
                <p className="text-center text-sm text-gray-600">
                  Contributors
                </p>
              </div>

              <div className="flex flex-col items-center rounded-lg border border-[#d0c0a0] bg-white p-6 shadow-sm">
                <div className="mb-3 text-[#6b4c35]">
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
                <h3 className="mb-2 text-3xl font-bold">
                  <CountUp end={homeContent?.stats?.totalCategories ?? 0} />
                </h3>
                <p className="text-center text-sm text-gray-600">Categories</p>
              </div>

              <div className="flex flex-col items-center rounded-lg border border-[#d0c0a0] bg-white p-6 shadow-sm">
                <div className="mb-3 text-[#6b4c35]">
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
                <h3 className="mb-2 text-3xl font-bold">
                  <CountUp end={homeContent?.stats?.dailyViews ?? 0} />
                </h3>
                <p className="text-center text-sm text-gray-600">Daily Views</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-accent-foreground">
                Wikipedia is growing every day thanks to contributors like you!
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
