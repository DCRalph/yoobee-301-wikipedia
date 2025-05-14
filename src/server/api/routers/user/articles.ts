import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "../../trpc";
import { TRPCError } from "@trpc/server";
import { generateSummary } from "~/lib/summary-generator";
import { generateTextDiff } from "~/lib/diff-utils";
import { moderateContent } from "~/lib/ai-moderator";

export const userArticlesRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
        filterPublished: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, filterPublished } = input;

      const where = {
        ...(filterPublished !== undefined
          ? { published: filterPublished }
          : {}),
        approved: true,
        needsApproval: false,
      };

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

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: {
          slug: input.slug,
          approved: true,
          needsApproval: false,
        },
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
            // take: 10,
            where: {
              approved: true,
              needsApproval: false,
            },
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
        title: z.string().min(1).max(100),
        content: z.string().min(1),
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        published: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Additional logic like slug validation would go here

      return ctx.db.article.create({
        data: {
          title: input.title,
          content: input.content,
          slug: input.slug,
          published: input.published,
          authorId: ctx.session.user.id,
          approved: false,
          needsApproval: true,
        },
      });
    }),

  summarize: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        level: z
          .enum(["novice", "intermediate", "advanced"])
          .default("intermediate"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { id: input.articleId, approved: true },
      });
      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }
      const summary = await generateSummary({
        content: article.content,
        level: input.level,
      });
      return { summary };
    }),

  saveSummary: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        summary: z.string().min(10),
        level: z
          .enum(["novice", "intermediate", "advanced"])
          .default("intermediate"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Save summary as a Note of type 'AI_SUMMARY' linked to the article and user

      const levelMap = {
        novice: "AI_SUMMARY_NOVICE",
        intermediate: "AI_SUMMARY_INTERMEDIATE",
        advanced: "AI_SUMMARY_ADVANCED",
      };

      await ctx.db.note.create({
        data: {
          content: input.summary,
          type: levelMap[input.level],
          articleId: input.articleId,
          userId: ctx.session.user.id,
        },
      });
      return { success: true };
    }),

  getRevisionById: publicProcedure
    .input(z.object({ revisionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const revision = await ctx.db.revision.findUnique({
        where: { id: input.revisionId, approved: true },
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              published: true,
            },
          },
          editor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
      if (!revision) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Revision not found",
        });
      }
      return revision;
    }),

  compareRevisions: publicProcedure
    .input(
      z.object({
        currentRevisionId: z.string(),
        oldRevisionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const currentRevision = await ctx.db.revision.findUnique({
        where: { id: input.currentRevisionId, approved: true },
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              published: true,
              content: true,
            },
          },
          editor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!currentRevision) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current revision not found",
        });
      }

      if (input.oldRevisionId === "current") {
        // const articleId = currentRevision.articleId;

        const article = currentRevision.article;

        const oldRevision = {
          id: "current",
          content: article.content,
          summary: null,
          createdAt: new Date(),
          articleId: article.id,
          editorId: "",
          editor: {
            id: "",
            name: "Current Version",
            image: null,
          },
          article: {
            id: article.id,
            slug: article.slug,
            title: article.title,
            published: article.published,
          },
        };

        return {
          currentRevision,
          oldRevision,
          article: currentRevision.article,
        };
      }

      const oldRevision = await ctx.db.revision.findUnique({
        where: { id: input.oldRevisionId, approved: true },
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              published: true,
            },
          },
          editor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!oldRevision) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Old revision not found",
        });
      }

      if (currentRevision.articleId !== oldRevision.articleId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Revisions do not belong to the same article",
        });
      }

      return {
        currentRevision,
        oldRevision,
        article: currentRevision.article,
      };
    }),

  createRevision: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the article to verify it exists
      const article = await ctx.db.article.findUnique({
        where: { id: input.articleId },
        select: { id: true, content: true },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Don't create a revision if content hasn't changed
      if (article.content === input.content) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No changes detected",
        });
      }

      // Generate diff between old and new content
      const diff = generateTextDiff(article.content, input.content);

      // Check if AI moderation is enabled and run it if so
      const setting = await ctx.db.setting.findFirst();
      let aiModeration = null;
      let checkedByAi = false;
      let aiMessage = null;
      let approvedByAi = false;

      if (setting?.enableAIFeatures) {
        aiModeration = await moderateContent(input.content, diff);
        checkedByAi = true;
        approvedByAi = aiModeration.isUseful && !aiModeration.error;
        aiMessage = aiModeration.error ??
          `AI Review Summary:\n` +
          `${aiModeration.reason}\n\n` +
          `Factual Accuracy & Relevance: ${aiModeration.factual_accuracy_and_relevance}\n` +
          `Coherence & Readability: ${aiModeration.coherence_and_readability}\n` +
          `Substance: ${aiModeration.substance}\n` +
          `Value of Contribution: ${aiModeration.contribution_value}\n\n` +
          `Overall Score: ${aiModeration.score}/10`;
      }

      // Create a revision with the new content
      const revision = await ctx.db.revision.create({
        data: {
          articleId: input.articleId,
          editorId: ctx.session.user.id,
          content: input.content,
          approved: approvedByAi,
          needsApproval: !approvedByAi,
          checkedByAi,
          aiMessage,
        },
      });

      if (approvedByAi) {
        await ctx.db.article.update({
          where: { id: input.articleId },
          data: { content: input.content },
        });
      }

      return revision;
    }),

  getPendingReview: protectedProcedure.query(async ({ ctx }) => {
    const articles = await ctx.db.article.findMany({
      where: {
        authorId: ctx.session.user.id,
        needsApproval: true,
      },
      orderBy: { updatedAt: "desc" },
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

    // Also get any pending revisions by this user
    const revisions = await ctx.db.revision.findMany({
      where: {
        editorId: ctx.session.user.id,
        needsApproval: true,
      },
      orderBy: { createdAt: "desc" },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        editor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return {
      articles,
      revisions,
    };
  }),

  getAllRevisions: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
        filter: z.enum(["all", "pending", "approved", "rejected"]).optional().default("all"),
        articleId: z.string().optional(),
        editorId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, filter, articleId, editorId } = input;

      // Build where conditions based on filters
      const where = {
        ...(articleId ? { articleId } : {}),
        ...(editorId ? { editorId } : {}),
        ...(filter === "pending" ? { needsApproval: true } :
          filter === "approved" ? { approved: true, needsApproval: false } :
            filter === "rejected" ? { approved: false, needsApproval: false } : {}),
      };

      const revisions = await ctx.db.revision.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          editor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (revisions.length > limit) {
        const nextItem = revisions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        revisions,
        nextCursor,
      };
    }),

  searchArticles: publicProcedure
    .input(
      z.object({
        searchTerm: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { searchTerm, limit } = input;

      const articles = await ctx.db.article.findMany({
        take: limit,
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { content: { contains: searchTerm, mode: 'insensitive' } },
                { slug: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            { published: true },
            { approved: true },
            { needsApproval: false },
          ],
        },
        orderBy: { updatedAt: "desc" },
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

      return { articles };
    }),
});
