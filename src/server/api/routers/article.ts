import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const articleRouter = createTRPCRouter({
  // Get home page data
  getHomePageData: publicProcedure.query(async ({ ctx }) => {
    // Get featured article
    const featuredArticle = await ctx.db.article.findFirst({
      where: {
        isFeatured: true,
        published: true,
        approved: true,
      },
      orderBy: {
        featuredAt: "desc",
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Get trending articles
    const trendingArticles = await ctx.db.article.findMany({
      where: {
        published: true,
        approved: true,
      },
      orderBy: {
        dailyViews: "desc",
      },
      take: 5,
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Get today's historical events
    const today = new Date();
    const historicalEvents = await ctx.db.historicalEvent.findMany({
      where: {
        month: today.getMonth() + 1,
        day: today.getDate(),
      },
      orderBy: {
        year: "desc",
      },
      take: 5,
    });

    // Get popular categories
    const categories = await ctx.db.category.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        articles: {
          _count: "desc",
        },
      },
      take: 10,
    });

    return {
      featuredArticle,
      trendingArticles,
      historicalEvents,
      categories,
    };
  }),

  // Track article view
  incrementView: publicProcedure
    .input(
      z.object({
        id: z.string(),
        ip: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ip } = input;

      // Find the article
      const article = await ctx.db.article.findUnique({
        where: { id },
        select: { lastViewReset: true, id: true, updatedAt: true },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Check if this IP has viewed this article in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existingView = await ctx.db.articleView.findFirst({
        where: {
          ip,
          articleId: id,
          createdAt: {
            gt: oneHourAgo,
          },
        },
      });

      // If view exists and is less than an hour old, don't increment
      if (existingView) {
        return {
          incremented: false,
          message: "View already counted within the last hour",
        };
      }

      // Create or update the view record for this IP
      await ctx.db.articleView.upsert({
        where: {
          ip_articleId: {
            ip,
            articleId: id,
          },
        },
        create: {
          ip,
          articleId: id,
        },
        update: {
          createdAt: new Date(), // Reset the timestamp
        },
      });

      // Check if we need to reset daily views
      const shouldResetDaily =
        new Date().getTime() - article.lastViewReset.getTime() >
        24 * 60 * 60 * 1000;

      // Update view counts
      const updatedArticle = await ctx.db.article.update({
        where: { id },
        data: {
          viewCount: { increment: 1 },
          dailyViews: shouldResetDaily ? 1 : { increment: 1 },
          lastViewReset: shouldResetDaily ? new Date() : undefined,
          updatedAt: article.updatedAt,
        },
      });

      return {
        incremented: true,
        viewCount: updatedArticle.viewCount,
      };
    }),

  // Update featured status
  setFeatured: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        featured: z.boolean(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or moderator
      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.role !== "MODERATOR"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and moderators can feature articles",
        });
      }

      return ctx.db.article.update({
        where: { id: input.id },
        data: {
          isFeatured: input.featured,
          featuredAt: input.featured ? new Date() : null,
          featuredDescription: input.featured ? input.description : null,
        },
      });
    }),

  // Get article categories
  getCategories: publicProcedure
    .input(
      z.object({
        articleId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.categoriesOnArticles.findMany({
        where: { articleId: input.articleId },
        include: { category: true },
      });
    }),

  // Update article categories
  updateCategories: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        categoryIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Delete existing categories
      await ctx.db.categoriesOnArticles.deleteMany({
        where: { articleId: input.articleId },
      });

      // Add new categories
      await ctx.db.categoriesOnArticles.createMany({
        data: input.categoryIds.map((categoryId) => ({
          articleId: input.articleId,
          categoryId,
          assignedAt: new Date(),
        })),
      });

      return { success: true };
    }),
});
