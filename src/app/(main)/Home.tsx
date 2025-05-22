"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { ChevronLeft, ChevronRight, Globe, Search } from "lucide-react"
import { useEffect, useState } from "react"
import CategorySelector from "../components/CategorySelector"
import { api } from "~/trpc/react"

// Types for our API responses
type FeaturedArticle = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  readMoreUrl: string;
};

type TrendingArticle = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  category: string;
  readMoreUrl: string;
};

type DailyContent = {
  todaysArticle: {
    id: string;
    title: string;
    excerpt: string;
    imageUrl: string;
    readMoreUrl: string;
  };
  onThisDay: {
    id: string;
    title: string;
    excerpt: string;
    imageUrl: string;
    readMoreUrl: string;
    items: Array<{
      id: string;
      year: number;
      text: string;
      readMoreUrl?: string;
    }>;
  };
};

export default function Home() {
  const { data: session } = useSession()
  const { data: featuredArticlesData, isLoading: isFeaturedLoading } = api.home.getFeaturedArticles.useQuery()
  const { data: trendingArticlesData, isLoading: isTrendingLoading } = api.home.getTrendingArticles.useQuery()
  const { data: dailyContentData, isLoading: isDailyLoading } = api.home.getDailyContent.useQuery()

  const loading = isFeaturedLoading || isTrendingLoading || isDailyLoading

  return (
    <div className="flex min-h-screen flex-col ">

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
          <h1 className="text-4xl md:text-5xl font-serif mb-2">Welcome to Wikipedia</h1>
          <p className="text-xl md:text-2xl font-serif">the free encyclopedia</p>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto my-8 flex items-center justify-center">
        <div className="h-px w-full max-w-3xl bg-[#c0a080]"></div>
        <div className="mx-4 h-2 w-2 rotate-45 bg-[#c0a080]"></div>
        <div className="h-px w-full max-w-3xl bg-[#c0a080]"></div>
      </div>

      {/* Categories Section */}
      <section className="container mx-auto mb-12 px-4">
        <h2 className="mb-2 text-center text-3xl font-serif">Articles</h2>
        <p className="mb-6 text-center">Find an article under the categories</p>
        <CategorySelector />
      </section>

      {/* News and Trending Section */}
      <section className="container mx-auto mb-12 px-4">
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -left-4 top-4 bg-white px-4 py-2 shadow-md z-10">
            <h3 className="text-lg font-medium">News</h3>
          </div>

          <div className="absolute -right-4 top-4 bg-white px-4 py-2 shadow-md z-10">
            <h3 className="text-lg font-medium">Trending</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6b4c35]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="overflow-hidden">
                {featuredArticlesData && featuredArticlesData.length > 0 && (
                  <Image
                    src={featuredArticlesData[0]?.imageUrl ?? "/home/1.png"}
                    alt={featuredArticlesData[0]?.title ?? "Featured Article"}
                    width={300}
                    height={200}
                    className="h-[200px] w-full object-cover"
                  />
                )}
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-[#6b4c35] p-4 text-white">
                  {featuredArticlesData && featuredArticlesData.length > 0 && (
                    <>
                      <h4 className="font-medium mb-2">{featuredArticlesData[0]?.title}</h4>
                      <p>{featuredArticlesData[0]?.excerpt}</p>
                      <div className="mt-4 text-right">
                        <Link href={featuredArticlesData[0]?.readMoreUrl ?? "#"} className="text-white hover:underline">
                          Read more
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white p-4 border border-[#d0c0a0]">
                  {trendingArticlesData && trendingArticlesData.length > 0 && (
                    <>
                      <h4 className="font-medium mb-2">{trendingArticlesData[0]?.title}</h4>
                      <p>{trendingArticlesData[0]?.excerpt}</p>
                      <div className="mt-4 text-right">
                        <Link href={trendingArticlesData[0]?.readMoreUrl ?? "#"} className="text-[#6b4c35] hover:underline">
                          Read more
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-[#6b4c35] p-4 text-white">
                  {trendingArticlesData && trendingArticlesData.length > 1 && (
                    <>
                      <h4 className="font-medium mb-2">{trendingArticlesData[1]?.title}</h4>
                      <p>{trendingArticlesData[1]?.excerpt}</p>
                      <div className="mt-4 text-right">
                        <Link href={trendingArticlesData[1]?.readMoreUrl ?? "#"} className="text-white hover:underline">
                          Read more
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <div className="overflow-hidden">
                  {featuredArticlesData && featuredArticlesData.length > 1 && (
                    <Image
                      src={featuredArticlesData[1]?.imageUrl ?? "/home/2.png"}
                      alt={featuredArticlesData[1]?.title ?? "Featured Article"}
                      width={300}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Today's Article and On This Day Section */}
      <section className="container mx-auto mb-12 px-4">
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -left-4 top-4 bg-white px-4 py-2 shadow-md z-10">
            <h3 className="text-lg font-medium">{"Today's Article"}</h3>
          </div>

          <div className="absolute -right-4 top-4 bg-white px-4 py-2 shadow-md z-10">
            <h3 className="text-lg font-medium">On this day</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6b4c35]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="overflow-hidden">
                {dailyContentData && (
                  <Image
                    src={dailyContentData.todaysArticle.imageUrl}
                    alt={dailyContentData.todaysArticle.title}
                    width={300}
                    height={200}
                    className="h-[200px] w-full object-cover"
                  />
                )}
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-white p-4 border border-[#d0c0a0]">
                  {dailyContentData && (
                    <>
                      <h4 className="font-medium mb-2">{dailyContentData.todaysArticle.title}</h4>
                      <p>{dailyContentData.todaysArticle.excerpt}</p>
                      <div className="mt-4 text-right">
                        <Link href={dailyContentData.todaysArticle.readMoreUrl} className="text-[#6b4c35] hover:underline">
                          Read more
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-[#6b4c35] p-4 text-white">
                  {dailyContentData?.onThisDay?.items && dailyContentData.onThisDay.items.length > 0 && (
                    <>
                      <h4 className="font-medium mb-2">{dailyContentData.onThisDay.items[0]?.year}</h4>
                      <p>{dailyContentData.onThisDay.items[0]?.text}</p>
                      {dailyContentData.onThisDay.items[0]?.readMoreUrl && (
                        <div className="mt-4 text-right">
                          <Link href={dailyContentData.onThisDay.items[0]?.readMoreUrl || "#"} className="text-white hover:underline">
                            Read more
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-[#6b4c35] p-4 text-white">
                  {dailyContentData?.onThisDay?.items && dailyContentData.onThisDay.items.length > 1 && (
                    <>
                      <h4 className="font-medium mb-2">{dailyContentData.onThisDay.items[1]?.year}</h4>
                      <p>{dailyContentData.onThisDay.items[1]?.text}</p>
                      {dailyContentData.onThisDay.items[1]?.readMoreUrl && (
                        <div className="mt-4 text-right">
                          <Link href={dailyContentData.onThisDay.items[1]?.readMoreUrl || "#"} className="text-white hover:underline">
                            Read more
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-white p-4 border border-[#d0c0a0]">
                  {dailyContentData?.onThisDay?.items && dailyContentData.onThisDay.items.length > 2 && (
                    <>
                      <h4 className="font-medium mb-2">{dailyContentData.onThisDay.items[2]?.year}</h4>
                      <p>{dailyContentData.onThisDay.items[2]?.text}</p>
                      {dailyContentData.onThisDay.items[2]?.readMoreUrl && (
                        <div className="mt-4 text-right">
                          <Link href={dailyContentData.onThisDay.items[2]?.readMoreUrl || "#"} className="text-[#6b4c35] hover:underline">
                            Read more
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2 overflow-hidden">
                  {dailyContentData && (
                    <Image
                      src={dailyContentData.onThisDay.imageUrl}
                      alt={dailyContentData.onThisDay.title}
                      width={600}
                      height={200}
                      className="h-[200px] w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
