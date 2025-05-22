import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Types for our API responses
export type FeaturedArticle = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
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

export const homeRouter = createTRPCRouter({
  getFeaturedArticles: publicProcedure.query(async ({ ctx }) => {
    // Get featured articles from the database
    const featuredArticles = await ctx.db.article.findMany({
      where: {
        isFeatured: true,
        published: true,
        approved: true,
      },
      orderBy: {
        featuredAt: 'desc'
      },
      take: 4,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    // Transform database articles to match our API type
    const transformedArticles: FeaturedArticle[] = featuredArticles.map(article => {
      // Get the first category if it exists
      const firstCategory = article.categories[0]?.category.name ?? "Uncategorized";

      return {
        id: article.id,
        title: article.title,
        // Use featuredDescription as excerpt or fall back to a substring of content
        excerpt: article.featuredDescription ?? article.content.substring(0, 150) + "...",
        imageUrl: article.imageUrl ?? "/home/1.png", // Default image if none exists
        category: firstCategory,
        readMoreUrl: `/article/${article.slug}`
      };
    });

    return transformedArticles;
  }),

  getTrendingArticles: publicProcedure.query(async ({ ctx }) => {
    // Get trending articles from the database
    const trendingDbArticles = await ctx.db.article.findMany({
      where: {
        published: true,
        approved: true,
      },
      orderBy: {
        dailyViews: 'desc'
      },
      take: 4,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    // Transform database articles to match our API type
    const transformedArticles: TrendingArticle[] = trendingDbArticles.map(article => {
      // Get the first category if it exists
      const firstCategory = article.categories[0]?.category.name ?? "Uncategorized";

      return {
        id: article.id,
        title: article.title,
        excerpt: article.content.substring(0, 150) + "...",
        imageUrl: article.imageUrl ?? undefined, // Convert null to undefined to match the type
        category: firstCategory,
        readMoreUrl: `/article/${article.slug}`
      };
    });

    return transformedArticles;
  }),

  getDailyContent: publicProcedure.query(async ({ ctx }) => {
    // Get today's featured article from the database
    const todaysArticle = await ctx.db.article.findFirst({
      where: {
        published: true,
        approved: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { featuredAt: 'desc' },
        { viewCount: 'desc' }
      ],
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    // Get today's historical events
    const today = new Date();
    const month = today.getMonth() + 1; // Months are 0-indexed in JS
    const day = today.getDate();

    const historicalEvents = await ctx.db.historicalEvent.findMany({
      where: {
        month,
        day
      },
      orderBy: {
        year: 'desc'
      },
      take: 5
    });

    // Transform database results to match our API type
    const transformedDailyContent: DailyContent = {
      todaysArticle: todaysArticle ? {
        id: todaysArticle.id,
        title: todaysArticle.title,
        excerpt: todaysArticle.featuredDescription ?? todaysArticle.content.substring(0, 150) + "...",
        imageUrl: todaysArticle.imageUrl ?? "/home/3.png",
        readMoreUrl: `/article/${todaysArticle.slug}`
      } : {
        id: "default",
        title: "The Great Barrier Reef",
        excerpt: "The world's largest coral reef system composed of over 2,900 individual reefs and 900 islands.",
        imageUrl: "/home/3.png",
        readMoreUrl: "/article/great-barrier-reef"
      },
      onThisDay: {
        id: "otd",
        title: "Historical Events on This Day",
        excerpt: `Significant events that occurred on ${month}/${day} throughout history.`,
        imageUrl: "/home/4.png",
        readMoreUrl: "/on-this-day",
        items: historicalEvents.length > 0
          ? historicalEvents.map(event => ({
            id: event.id,
            year: event.year,
            text: event.description,
            readMoreUrl: `/historical-event/${event.id}`
          }))
          : [
            {
              id: "otd-item1",
              year: 1969,
              text: "Apollo 11 landed on the moon, and Neil Armstrong became the first person to walk on its surface.",
              readMoreUrl: "/article/apollo-11-moon-landing"
            },
            {
              id: "otd-item2",
              year: 1945,
              text: "The United Nations Charter was signed in San Francisco, establishing the United Nations.",
              readMoreUrl: "/article/united-nations-founding"
            }
          ]
      }
    };

    return transformedDailyContent;
  }),

  getAllHomeContent: publicProcedure.query(async ({ ctx }) => {
    // Get featured articles
    const featured = await ctx.db.article.findMany({
      where: {
        isFeatured: true,
        published: true,
        approved: true,
      },
      orderBy: {
        featuredAt: 'desc'
      },
      take: 4,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    }).then(articles => articles.map(article => {
      const firstCategory = article.categories[0]?.category.name ?? "Uncategorized";
      return {
        id: article.id,
        title: article.title,
        excerpt: article.featuredDescription ?? article.content.substring(0, 150) + "...",
        imageUrl: article.imageUrl ?? "/home/1.png",
        category: firstCategory,
        readMoreUrl: `/article/${article.slug}`
      };
    }));

    // Get trending articles
    const trending = await ctx.db.article.findMany({
      where: {
        published: true,
        approved: true,
      },
      orderBy: {
        dailyViews: 'desc'
      },
      take: 4,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    }).then(articles => articles.map(article => {
      const firstCategory = article.categories[0]?.category.name ?? "Uncategorized";
      return {
        id: article.id,
        title: article.title,
        excerpt: article.content.substring(0, 150) + "...",
        imageUrl: article.imageUrl ?? undefined,
        category: firstCategory,
        readMoreUrl: `/article/${article.slug}`
      };
    }));

    // Get daily content
    // Get today's featured article from the database
    const todaysArticle = await ctx.db.article.findFirst({
      where: {
        published: true,
        approved: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { featuredAt: 'desc' },
        { viewCount: 'desc' }
      ],
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    // Get today's historical events
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const historicalEvents = await ctx.db.historicalEvent.findMany({
      where: {
        month,
        day
      },
      orderBy: {
        year: 'desc'
      },
      take: 5
    });

    // Transform database results to match our API type
    const daily: DailyContent = {
      todaysArticle: todaysArticle ? {
        id: todaysArticle.id,
        title: todaysArticle.title,
        excerpt: todaysArticle.featuredDescription ?? todaysArticle.content.substring(0, 150) + "...",
        imageUrl: todaysArticle.imageUrl ?? "/home/3.png",
        readMoreUrl: `/article/${todaysArticle.slug}`
      } : {
        id: "default",
        title: "The Great Barrier Reef",
        excerpt: "The world's largest coral reef system composed of over 2,900 individual reefs and 900 islands.",
        imageUrl: "/home/3.png",
        readMoreUrl: "/article/great-barrier-reef"
      },
      onThisDay: {
        id: "otd",
        title: "Historical Events on This Day",
        excerpt: `Significant events that occurred on ${month}/${day} throughout history.`,
        imageUrl: "/home/4.png",
        readMoreUrl: "/on-this-day",
        items: historicalEvents.length > 0
          ? historicalEvents.map(event => ({
            id: event.id,
            year: event.year,
            text: event.description,
            readMoreUrl: `/historical-event/${event.id}`
          }))
          : [
            {
              id: "otd-item1",
              year: 1969,
              text: "Apollo 11 landed on the moon, and Neil Armstrong became the first person to walk on its surface.",
              readMoreUrl: "/article/apollo-11-moon-landing"
            },
            {
              id: "otd-item2",
              year: 1945,
              text: "The United Nations Charter was signed in San Francisco, establishing the United Nations.",
              readMoreUrl: "/article/united-nations-founding"
            }
          ]
      }
    };

    return {
      featured,
      trending,
      daily
    };
  }),
}); 