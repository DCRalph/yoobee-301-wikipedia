import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { vectorSearch, findSimilarArticles } from "~/lib/vector-search";

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

  // Vector search with execution timing
  vectorSearch: publicProcedure
    .input(
      z.object({
        searchTerm: z.string().min(1, "Search term is required"),
        itemsPerPage: z.number().min(1).max(40).default(10),
        searchType: z.enum(["title", "content", "hybrid"]).default("title"),
        page: z.number().min(1).default(1),
        maxDistance: z.number().min(0).max(2).default(1.0),
        titleWeight: z.number().min(0).max(1).default(0.3),
        contentWeight: z.number().min(0).max(1).default(0.7),
      }),
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        const response = await vectorSearch({
          searchTerm: input.searchTerm,
          itemsPerPage: Math.min(input.itemsPerPage, 10), // Force limit to 10
          searchType: input.searchType,
          page: input.page,
          maxDistance: input.maxDistance,
          maxQueryLimit: 10, // Internal query limit
          titleWeight: input.titleWeight,
          contentWeight: input.contentWeight,
        });

        const executionTime = Date.now() - startTime;

        // Transform results to match SearchDialog expectations
        const articles = response.results.map((result) => {
          const numWords = result.content.split(" ").length;
          const readTime = Math.ceil(numWords / 200);

          return {
            id: result.id,
            title: result.title,
            slug: result.slug,
            author: { name: result.author.name },
            updatedAt: result.updatedAt,
            category: "Article", // Default category since we don't have this in vector search
            readTime: `${readTime} min read`,
            similarity: result.similarity,
            distance: result.distance,
          };
        });

        return {
          articles,
          totalFound: response.totalFound,
          executionTime,
          searchType: response.searchType,
          page: response.page,
          itemsPerPage: response.itemsPerPage,
          totalPages: response.totalPages,
        };
      } catch (error) {
        console.error("Vector search error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to perform vector search",
        });
      }
    }),

  // Get similar articles
  getSimilarArticles: publicProcedure
    .input(
      z.object({
        articleId: z.string(),
        itemsPerPage: z.number().min(1).max(10).default(5),
        maxDistance: z.number().min(0).max(2).default(1.0),
        searchType: z.enum(["title", "content", "hybrid"]).default("title"),
        titleWeight: z.number().min(0).max(1).default(0.3),
        contentWeight: z.number().min(0).max(1).default(0.7),
      }),
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        const response = await findSimilarArticles(
          input.articleId,
          input.itemsPerPage,
          input.maxDistance,
          input.searchType,
          input.titleWeight,
          input.contentWeight,
        );

        const executionTime = Date.now() - startTime;

        // Transform results to match expected format
        const articles = response.results.map((result) => {
          const numWords = result.content.split(" ").length;
          const readTime = Math.ceil(numWords / 200);

          return {
            id: result.id,
            title: result.title,
            slug: result.slug,
            author: { name: result.author.name },
            updatedAt: result.updatedAt,
            readTime: `${readTime} min read`,
            similarity: result.similarity,
            distance: result.distance,
            content: result.content.substring(0, 200) + "...", // Truncate for preview
            titleDistance: result.titleDistance,
            contentDistance: result.contentDistance,
          };
        });

        return {
          articles,
          totalFound: response.totalFound,
          executionTime,
          searchType: response.searchType,
        };
      } catch (error) {
        console.error("Similar articles search error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to find similar articles",
        });
      }
    }),
});
