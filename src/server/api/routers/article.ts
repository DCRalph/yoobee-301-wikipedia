import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

export const articleRouter = createTRPCRouter({
  // Get home page data
  getHomePageData: publicProcedure
    .query(async ({ ctx }) => {
      // Get featured article
      const featuredArticle = await ctx.db.article.findFirst({
        where: {
          isFeatured: true,
          published: true,
          approved: true,
        },
        orderBy: {
          featuredAt: 'desc'
        },
        include: {
          author: {
            select: {
              name: true,
              image: true
            }
          },
          categories: {
            include: {
              category: true
            }
          }
        }
      })

      // Get trending articles
      const trendingArticles = await ctx.db.article.findMany({
        where: {
          published: true,
          approved: true,
        },
        orderBy: {
          dailyViews: 'desc'
        },
        take: 5,
        include: {
          author: {
            select: {
              name: true,
              image: true
            }
          },
          categories: {
            include: {
              category: true
            }
          }
        }
      })

      // Get today's historical events
      const today = new Date()
      const historicalEvents = await ctx.db.historicalEvent.findMany({
        where: {
          month: today.getMonth() + 1,
          day: today.getDate()
        },
        orderBy: {
          year: 'desc'
        },
        take: 5
      })

      // Get popular categories
      const categories = await ctx.db.category.findMany({
        include: {
          _count: {
            select: {
              articles: true
            }
          }
        },
        orderBy: {
          articles: {
            _count: 'desc'
          }
        },
        take: 10
      })

      return {
        featuredArticle,
        trendingArticles,
        historicalEvents,
        categories
      }
    }),

  // Track article view
  incrementView: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { id: input.id },
        select: { lastViewReset: true }
      })

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Article not found'
        })
      }

      // Check if we need to reset daily views
      const shouldResetDaily = new Date().getTime() - article.lastViewReset.getTime() > 24 * 60 * 60 * 1000

      // Update view counts
      const updatedArticle = await ctx.db.article.update({
        where: { id: input.id },
        data: {
          viewCount: { increment: 1 },
          dailyViews: shouldResetDaily ? 1 : { increment: 1 },
          lastViewReset: shouldResetDaily ? new Date() : undefined
        }
      })

      return { viewCount: updatedArticle.viewCount }
    }),

  // Update featured status
  setFeatured: protectedProcedure
    .input(z.object({
      id: z.string(),
      featured: z.boolean(),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or moderator
      if (ctx.session.user.role !== 'ADMIN' && ctx.session.user.role !== 'MODERATOR') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and moderators can feature articles'
        })
      }

      return ctx.db.article.update({
        where: { id: input.id },
        data: {
          isFeatured: input.featured,
          featuredAt: input.featured ? new Date() : null,
          featuredDescription: input.featured ? input.description : null
        }
      })
    }),

  // Get article categories
  getCategories: publicProcedure
    .input(z.object({
      articleId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.categoriesOnArticles.findMany({
        where: { articleId: input.articleId },
        include: { category: true }
      })
    }),

  // Update article categories
  updateCategories: protectedProcedure
    .input(z.object({
      articleId: z.string(),
      categoryIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      // Delete existing categories
      await ctx.db.categoriesOnArticles.deleteMany({
        where: { articleId: input.articleId }
      })

      // Add new categories
      await ctx.db.categoriesOnArticles.createMany({
        data: input.categoryIds.map(categoryId => ({
          articleId: input.articleId,
          categoryId,
          assignedAt: new Date()
        }))
      })

      return { success: true }
    })
}) 