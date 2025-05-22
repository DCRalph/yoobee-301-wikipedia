import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

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