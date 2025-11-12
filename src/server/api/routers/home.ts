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
};

export type HomeContent = {
  featured: FeaturedArticle[];
  trending: TrendingArticle[];
  daily: DailyContent;
  stats?: {
    totalUsers: number;
    totalCategories: number;
    dailyViews: number;
  };
  timings?: {
    featured: number;
    trending: number;
    todaysArticle: number;
    stats: number;
    statTimings?: {
      totalUsers: number;
      totalCategories: number;
      dailyViews: number;
    };
  };
};

// ---------- Helpers ----------

const CATEGORIES_INCLUDE = {
  categories: {
    include: { category: true },
  },
} as const;

const createExcerpt = (
  content: string,
  featuredDescription?: string | null,
): string => featuredDescription ?? content.substring(0, 150) + "...";

type RawArticle = {
  id: string;
  title: string;
  content: string;
  featuredDescription?: string | null;
  imageUrl?: string | null;
  slug: string;
  categories: Array<{ category: { name: string } }>;
};

const toArticleCard = (
  article: RawArticle,
  urlPrefix = "/wiki/",
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

const timeDbCall = async <T>(
  dbCall: () => Promise<T>,
): Promise<{ result: T; timing: number }> => {
  const start = performance.now();
  const result = await dbCall();
  return { result, timing: performance.now() - start };
};

// Extract or log errors from Promise.allSettled results
const getFulfilled = <T>(
  settled: PromiseSettledResult<T>,
  label: string,
): T | null => {
  if (settled.status === "fulfilled") return settled.value;
  console.error(`Error in ${label}:`, settled.reason);
  return null;
};

// ---------- Routers ----------

export const homeRouter = createTRPCRouter({
  // Get all home content in a single query to reduce API calls
  getHomeContent: publicProcedure.query(async ({ ctx }) => {
    try {
      const baseResult: HomeContent = {
        featured: [],
        trending: [],
        daily: {},
        timings: {
          featured: 0,
          trending: 0,
          todaysArticle: 0,
          stats: 0,
        },
      };

      const [
        featuredSettled,
        trendingSettled,
        todaysSettled,
        statsSettled,
      ] = await Promise.allSettled([
        timeDbCall(() =>
          ctx.db.article.findMany({
            where: {
              isFeatured: true,
              published: true,
              approved: true,
              needsApproval: false,
            },
            orderBy: { featuredAt: "desc" },
            take: 4,
            include: CATEGORIES_INCLUDE,
          }),
        ),
        timeDbCall(() =>
          ctx.db.article.findMany({
            where: {
              published: true,
              approved: true,
              needsApproval: false,
            },
            orderBy: { dailyViews: "desc" },
            take: 4,
            include: CATEGORIES_INCLUDE,
          }),
        ),
        timeDbCall(() =>
          ctx.db.article.findFirst({
            where: {
              published: true,
              approved: true,
              needsApproval: false,
            },
            orderBy: [
              { isFeatured: "desc" },
              { featuredAt: "desc" },
              { viewCount: "desc" },
            ],
            include: CATEGORIES_INCLUDE,
          }),
        ),
        timeDbCall(async () => {
          // Stats sub-queries with individual timings
          const [userCount, categoryCount, dailyViews] = await Promise.allSettled(
            [
              timeDbCall(() => ctx.db.user.count()),
              timeDbCall(() => ctx.db.category.count()),
              timeDbCall(() =>
                ctx.db.articleView.count({
                  where: {
                    createdAt: {
                      gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                }),
              ),
            ],
          );

          const users =
            userCount.status === "fulfilled" ? userCount.value.result : 0;
          const categories =
            categoryCount.status === "fulfilled" ? categoryCount.value.result : 0;
          const views =
            dailyViews.status === "fulfilled" ? dailyViews.value.result : 0;

          return {
            totalUsers: users,
            totalCategories: categories,
            dailyViews: views,
            statTimings: {
              totalUsers:
                userCount.status === "fulfilled" ? userCount.value.timing : 0,
              totalCategories:
                categoryCount.status === "fulfilled"
                  ? categoryCount.value.timing
                  : 0,
              dailyViews:
                dailyViews.status === "fulfilled"
                  ? dailyViews.value.timing
                  : 0,
            },
          };
        }),
      ]);

      // Featured
      const featured = getFulfilled(featuredSettled, "featured");
      if (featured) {
        baseResult.featured = featured.result.map((a: RawArticle) =>
          toArticleCard(a),
        );
        baseResult.timings!.featured = featured.timing;
      }

      // Trending
      const trending = getFulfilled(trendingSettled, "trending");
      if (trending) {
        baseResult.trending = trending.result.map((a: RawArticle) =>
          toArticleCard(a),
        );
        baseResult.timings!.trending = trending.timing;
      }

      // Today's article
      const todays = getFulfilled(todaysSettled, "todaysArticle");
      if (todays) {
        const art = todays.result as RawArticle | null;
        if (art) {
          baseResult.daily.todaysArticle = {
            id: art.id,
            title: art.title,
            excerpt: createExcerpt(art.content, art.featuredDescription),
            imageUrl: art.imageUrl ?? undefined,
            readMoreUrl: `/wiki/${art.slug}`,
          };
        }
        baseResult.timings!.todaysArticle = todays.timing;
      }

      // Stats
      const stats = getFulfilled(statsSettled, "stats");
      if (stats) {
        baseResult.stats = {
          totalUsers: stats.result.totalUsers,
          totalCategories: stats.result.totalCategories,
          dailyViews: stats.result.dailyViews,
        };
        baseResult.timings!.stats = stats.timing;
        baseResult.timings!.statTimings = stats.result.statTimings;
      }

      return baseResult;
    } catch (error) {
      console.error("Error fetching home content:", error);
      return {
        featured: [],
        trending: [],
        daily: {},
        timings: {
          featured: 0,
          trending: 0,
          todaysArticle: 0,
          stats: 0,
          statTimings: {
            totalUsers: 0,
            totalCategories: 0,
            dailyViews: 0,
          },
        },
      } satisfies HomeContent;
    }
  }),

  // Legacy endpoints for backward compatibility
  getFeaturedArticles: publicProcedure.query(async ({ ctx }) => {
    try {
      const items = await ctx.db.article.findMany({
        where: { isFeatured: true, published: true, approved: true },
        orderBy: { featuredAt: "desc" },
        take: 4,
        include: CATEGORIES_INCLUDE,
      });

      return items.map((a: RawArticle) => toArticleCard(a));
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      return [];
    }
  }),

  getTrendingArticles: publicProcedure.query(async ({ ctx }) => {
    try {
      const items = await ctx.db.article.findMany({
        where: { published: true, approved: true },
        orderBy: { dailyViews: "desc" },
        take: 4,
        include: CATEGORIES_INCLUDE,
      });

      return items.map((a: RawArticle) => toArticleCard(a));
    } catch (error) {
      console.error("Error fetching trending articles:", error);
      return [];
    }
  }),

  getDailyContent: publicProcedure.query(async ({ ctx }) => {
    try {
      const art = await ctx.db.article.findFirst({
        where: { published: true, approved: true },
        orderBy: [
          { isFeatured: "desc" },
          { featuredAt: "desc" },
          { viewCount: "desc" },
        ],
        include: CATEGORIES_INCLUDE,
      });

      if (!art) return {};

      const a = art as RawArticle;
      return {
        todaysArticle: {
          id: a.id,
          title: a.title,
          excerpt: createExcerpt(a.content, a.featuredDescription),
          imageUrl: a.imageUrl ?? undefined,
          readMoreUrl: `/wiki/${a.slug}`,
        },
      } satisfies DailyContent;
    } catch (error) {
      console.error("Error fetching daily content:", error);
      return {};
    }
  }),
});