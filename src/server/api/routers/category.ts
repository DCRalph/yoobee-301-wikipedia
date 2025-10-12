import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { type Prisma } from "@prisma/client"

export const categoryRouter = createTRPCRouter({
  // Get all categories
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.category.findMany({
        include: {
          _count: {
            select: {
              articles: true
            }
          },
          children: true,
          parent: true
        }
      })
    }),

  // Get top articles for each category
  getTopArticlesByCategory: publicProcedure
    .query(async ({ ctx }) => {
      // Get all categories first
      const categories = await ctx.db.category.findMany({
        where: {
          parentId: null // Only top-level categories
        },
        include: {
          _count: {
            select: {
              articles: true
            }
          }
        }
      });

      // For each category, get the top 10 most viewed articles
      const categoriesWithTopArticles = await Promise.all(
        categories.map(async (category) => {
          const topArticles = await ctx.db.article.findMany({
            where: {
              published: true,
              approved: true,
              needsApproval: false,
              categories: {
                some: {
                  categoryId: category.id
                }
              }
            },
            orderBy: {
              viewCount: 'desc'
            },
            take: 10,
            include: {
              author: {
                select: {
                  name: true,
                  image: true
                }
              },
              categories: {
                include: {
                  category: {
                    select: {
                      name: true,
                      slug: true
                    }
                  }
                }
              }
            }
          });

          return {
            ...category,
            topArticles
          };
        })
      );

      return categoriesWithTopArticles;
    }),

  // Get category by slug
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { slug: input.slug },
        include: {
          _count: {
            select: {
              articles: true
            }
          },
          children: true,
          parent: true
        }
      })

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found'
        })
      }

      return category
    }),

  // Get articles by category slug with pagination
  getArticlesBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(12),
      sortBy: z.enum(['recent', 'popular', 'title']).default('recent')
    }))
    .query(async ({ ctx, input }) => {
      const { slug, page, limit, sortBy } = input;
      const skip = (page - 1) * limit;

      // First, get the category to ensure it exists
      const category = await ctx.db.category.findUnique({
        where: { slug },
        select: { id: true, name: true, description: true }
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found'
        });
      }

      // Build the orderBy clause based on sortBy
      let orderBy: Prisma.ArticleOrderByWithRelationInput = { createdAt: 'desc' };
      if (sortBy === 'popular') {
        orderBy = { viewCount: 'desc' };
      } else if (sortBy === 'title') {
        orderBy = { title: 'asc' };
      }

      // Get articles in this category
      const articles = await ctx.db.article.findMany({
        where: {
          published: true,
          approved: true,
          categories: {
            some: {
              categoryId: category.id
            }
          }
        },
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              name: true,
              image: true
            }
          },
          categories: {
            include: {
              category: {
                select: {
                  name: true,
                  slug: true
                }
              }
            }
          },
        }
      });

      // Get total count for pagination
      const totalCount = await ctx.db.article.count({
        where: {
          published: true,
          approved: true,
          categories: {
            some: {
              categoryId: category.id
            }
          }
        }
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        category,
        articles,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    }),

  // Create new category
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      parentId: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or moderator
      if (ctx.session.user.role !== 'ADMIN' && ctx.session.user.role !== 'MODERATOR') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and moderators can create categories'
        })
      }

      // Check if slug is unique
      const existing = await ctx.db.category.findUnique({
        where: { slug: input.slug }
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Category with this slug already exists'
        })
      }

      return ctx.db.category.create({
        data: input
      })
    }),

  // Update category
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      parentId: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or moderator
      if (ctx.session.user.role !== 'ADMIN' && ctx.session.user.role !== 'MODERATOR') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and moderators can update categories'
        })
      }

      const { id, ...data } = input

      return ctx.db.category.update({
        where: { id },
        data
      })
    }),

  // Delete category
  delete: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete categories'
        })
      }

      // Check if category has articles
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              articles: true
            }
          }
        }
      })

      if (category?._count?.articles && category._count.articles > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete category with existing articles'
        })
      }

      return ctx.db.category.delete({
        where: { id: input.id }
      })
    })
}) 