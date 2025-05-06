import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const articlesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
        filterPublished: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, filterPublished } = input;

      const where =
        filterPublished !== undefined
          ? { published: filterPublished }
          : undefined;

      const articles = await ctx.db.article.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (articles.length > limit) {
        const nextItem = articles.pop();
        nextCursor = nextItem?.id;
      }

      return {
        articles,
        nextCursor,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          revisions: {
            orderBy: { createdAt: "desc" },
            include: {
              editor: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      return article;
    }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { slug: input.slug },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          revisions: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              editor: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      return article;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        content: z.string().min(1),
        published: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existingArticle = await ctx.db.article.findUnique({
        where: { slug: input.slug },
      });

      if (existingArticle) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Slug already exists",
        });
      }

      const { session } = ctx;

      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      return ctx.db.article.create({
        data: {
          title: input.title,
          slug: input.slug,
          content: input.content,
          published: input.published,
          author: {
            connect: { id: session.user.id },
          },
          revisions: {
            create: {
              content: input.content,
              summary: "Initial creation",
              editor: {
                connect: { id: session.user.id },
              },
            },
          },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        published: z.boolean().optional(),
        summary: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // If slug is being updated, check if the new slug already exists
      if (input.slug) {
        const existingArticle = await ctx.db.article.findFirst({
          where: {
            slug: input.slug,
            id: { not: input.id },
          },
        });

        if (existingArticle) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Slug already exists",
          });
        }
      }

      const { session } = ctx;

      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Get the current article to check for changes
      const currentArticle = await ctx.db.article.findUnique({
        where: { id: input.id },
        select: { content: true },
      });

      if (!currentArticle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Create a new revision if content is changed
      let createRevision = false;
      if (input.content && input.content !== currentArticle.content) {
        createRevision = true;
      }

      // Update the article
      const article = await ctx.db.article.update({
        where: { id: input.id },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.slug && { slug: input.slug }),
          ...(input.content && { content: input.content }),
          ...(input.published !== undefined && { published: input.published }),
          updatedAt: new Date(),
        },
      });

      // Create a revision if content changed
      if (createRevision && input.content) {
        await ctx.db.revision.create({
          data: {
            content: input.content,
            summary: input.summary ?? "Updated content",
            article: {
              connect: { id: input.id },
            },
            editor: {
              connect: { id: session.user.id },
            },
          },
        });
      }

      return article;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Delete all revisions first
      await ctx.db.revision.deleteMany({
        where: { articleId: input.id },
      });

      // Then delete the article
      return ctx.db.article.delete({
        where: { id: input.id },
      });
    }),
});
