// import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Types for our API responses
export type FeaturedArticle = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  category: string;
  readMoreUrl: string;
};

export type TrendingArticle = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  category: string;
  readMoreUrl: string;
};

export type DailyContent = {
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

export type HomeContent = {
  featured: FeaturedArticle[];
  trending: TrendingArticle[];
  daily: DailyContent;
  stats?: {
    totalArticles: number;
    totalUsers: number;
    totalCategories: number;
    dailyViews: number;
  };
};

// Helper function to create excerpt
const createExcerpt = (
  content: string,
  featuredDescription?: string | null,
): string => {
  return featuredDescription ?? content.substring(0, 150) + "...";
};

// Helper function to transform article to featured/trending format
const transformArticle = (
  article: {
    id: string;
    title: string;
    content: string;
    featuredDescription?: string | null;
    imageUrl?: string | null;
    slug: string;
    categories: Array<{
      category: {
        name: string;
      };
    }>;
  },
  urlPrefix = "/article/",
): FeaturedArticle | TrendingArticle => {
  const firstCategory = article.categories[0]?.category.name ?? "Uncategorized";

  return {
    id: article.id,
    title: article.title,
    excerpt: createExcerpt(article.content, article.featuredDescription),
    imageUrl: article.imageUrl ?? undefined,
    category: firstCategory,
    readMoreUrl: `${urlPrefix}${article.slug}`,
  };
};

export const homeRouter = createTRPCRouter({
  // Get all home content in a single query to reduce API calls
  getHomeContent: publicProcedure.query(async ({ ctx }) => {
    try {
      const result: HomeContent = {
        featured: [],
        trending: [],
        daily: {},
      };

      // Get featured articles
      const featuredArticles = await ctx.db.article.findMany({
        where: {
          isFeatured: true,
          published: true,
          approved: true,
        },
        orderBy: {
          featuredAt: "desc",
        },
        take: 4,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      result.featured = featuredArticles.map((article) =>
        transformArticle(article),
      );

      // Get trending articles
      const trendingArticles = await ctx.db.article.findMany({
        where: {
          published: true,
          approved: true,
        },
        orderBy: {
          dailyViews: "desc",
        },
        take: 4,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      result.trending = trendingArticles.map((article) =>
        transformArticle(article),
      );

      // Get today's featured article
      const todaysArticle = await ctx.db.article.findFirst({
        where: {
          published: true,
          approved: true,
        },
        orderBy: [
          { isFeatured: "desc" },
          { featuredAt: "desc" },
          { viewCount: "desc" },
        ],
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (todaysArticle) {
        result.daily.todaysArticle = {
          id: todaysArticle.id,
          title: todaysArticle.title,
          excerpt: createExcerpt(
            todaysArticle.content,
            todaysArticle.featuredDescription,
          ),
          imageUrl: todaysArticle.imageUrl ?? undefined,
          readMoreUrl: `/article/${todaysArticle.slug}`,
        };
      }

      // Get today's historical events
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const historicalEvents = await ctx.db.historicalEvent.findMany({
        where: {
          month,
          day,
        },
        orderBy: {
          year: "desc",
        },
        take: 5,
      });

      if (historicalEvents.length > 0) {
        // Get the on this day page info
        const onThisDayPage = await ctx.db.article.findFirst({
          where: {
            slug: "on-this-day",
            published: true,
            approved: true,
          },
        });

        result.daily.onThisDay = {
          id: "otd",
          title: onThisDayPage?.title ?? `Events on ${month}/${day}`,
          excerpt:
            onThisDayPage?.featuredDescription ??
            `Historical events from ${month}/${day}`,
          imageUrl: onThisDayPage?.imageUrl ?? undefined,
          readMoreUrl: "/on-this-day",
          items: historicalEvents.map((event) => ({
            id: event.id,
            year: event.year,
            text: event.description,
            readMoreUrl: `/historical-event/${event.id}`,
          })),
        };
      }

      // Get statistics counts
      const [articleCount, userCount, categoryCount, viewsCount] =
        await Promise.all([
          ctx.db.article.count({
            where: {
              published: true,
              approved: true,
            },
          }),
          ctx.db.user.count(),
          ctx.db.category.count(),
          ctx.db.articleView.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          }),
        ]);

      result.stats = {
        totalArticles: articleCount,
        totalUsers: userCount,
        totalCategories: categoryCount,
        dailyViews: viewsCount,
      };

      return result;
    } catch (error) {
      console.error("Error fetching home content:", error);
      return {
        featured: [],
        trending: [],
        daily: {},
      };
    }
  }),

  // Legacy endpoints for backward compatibility
  getFeaturedArticles: publicProcedure.query(async ({ ctx }) => {
    try {
      const featuredArticles = await ctx.db.article.findMany({
        where: {
          isFeatured: true,
          published: true,
          approved: true,
        },
        orderBy: {
          featuredAt: "desc",
        },
        take: 4,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      return featuredArticles.map((article) => transformArticle(article));
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      return [];
    }
  }),

  getTrendingArticles: publicProcedure.query(async ({ ctx }) => {
    try {
      const trendingArticles = await ctx.db.article.findMany({
        where: {
          published: true,
          approved: true,
        },
        orderBy: {
          dailyViews: "desc",
        },
        take: 4,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      return trendingArticles.map((article) => transformArticle(article));
    } catch (error) {
      console.error("Error fetching trending articles:", error);
      return [];
    }
  }),

  getDailyContent: publicProcedure.query(async ({ ctx }) => {
    try {
      const result: DailyContent = {};

      // Get today's featured article
      const todaysArticle = await ctx.db.article.findFirst({
        where: {
          published: true,
          approved: true,
        },
        orderBy: [
          { isFeatured: "desc" },
          { featuredAt: "desc" },
          { viewCount: "desc" },
        ],
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (todaysArticle) {
        result.todaysArticle = {
          id: todaysArticle.id,
          title: todaysArticle.title,
          excerpt: createExcerpt(
            todaysArticle.content,
            todaysArticle.featuredDescription,
          ),
          imageUrl: todaysArticle.imageUrl ?? undefined,
          readMoreUrl: `/article/${todaysArticle.slug}`,
        };
      }

      // Get today's historical events
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const historicalEvents = await ctx.db.historicalEvent.findMany({
        where: {
          month,
          day,
        },
        orderBy: {
          year: "desc",
        },
        take: 5,
      });

      if (historicalEvents.length > 0) {
        // Get the on this day page info
        const onThisDayPage = await ctx.db.article.findFirst({
          where: {
            slug: "on-this-day",
            published: true,
            approved: true,
          },
        });

        result.onThisDay = {
          id: "otd",
          title: onThisDayPage?.title ?? `Events on ${month}/${day}`,
          excerpt:
            onThisDayPage?.featuredDescription ??
            `Historical events from ${month}/${day}`,
          imageUrl: onThisDayPage?.imageUrl ?? undefined,
          readMoreUrl: "/on-this-day",
          items: historicalEvents.map((event) => ({
            id: event.id,
            year: event.year,
            text: event.description,
            readMoreUrl: `/historical-event/${event.id}`,
          })),
        };
      }

      return result;
    } catch (error) {
      console.error("Error fetching daily content:", error);
      return {};
    }
  }),
});
