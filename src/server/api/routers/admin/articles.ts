import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const adminArticlesRouter = createTRPCRouter({
  getAll: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
        filterPublished: z.boolean().optional(),
        filterApproved: z.boolean().optional(),
        filterNeedsApproval: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        limit,
        cursor,
        filterPublished,
        filterApproved,
        filterNeedsApproval,
      } = input;

      const articles = await ctx.db.article.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        where: {
          ...(filterPublished !== undefined
            ? { published: filterPublished }
            : {}),
          ...(filterApproved !== undefined ? { approved: filterApproved } : {}),
          ...(filterNeedsApproval !== undefined
            ? { needsApproval: filterNeedsApproval }
            : {}),
        },
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

  getById: adminProcedure
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

  // Delete an article
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Delete all revisions associated with the article
      await ctx.db.revision.deleteMany({
        where: { articleId: input.id },
      });

      // Delete all notes associated with the article
      await ctx.db.note.deleteMany({
        where: { articleId: input.id },
      });

      // Delete the article
      await ctx.db.article.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Update an article
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100).optional(),
        content: z.string().min(1).optional(),
        slug: z
          .string()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .optional(),
        published: z.boolean().optional(),
        approved: z.boolean().optional(),
        needsApproval: z.boolean().optional(),
        // New fields
        quickFacts: z.any().optional(), // Using any for JSON to maintain flexibility
        sources: z.string().optional(),
        talkContent: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const article = await ctx.db.article.findUnique({
        where: { id },
        select: {
          id: true,
          content: true,
          quickFacts: true,
          sources: true,
          talkContent: true,
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Check if any content has changed
      const contentChanged =
        data.content !== undefined ||
        data.quickFacts !== undefined ||
        data.sources !== undefined ||
        data.talkContent !== undefined;

      // If we're changing content, create a revision
      if (contentChanged) {
        // Create a revision with the old content
        await ctx.db.revision.create({
          data: {
            articleId: id,
            editorId: ctx.session.user.id,
            content: article.content,
            quickFacts: article.quickFacts ?? {},
            sources: article.sources,
            talkContent: article.talkContent,
            approved: true, // Admin edits are auto-approved
            needsApproval: false,
          },
        });
      }

      // Update the article with the new data
      return ctx.db.article.update({
        where: { id },
        data: {
          ...data,
          // Set approval date if article is being approved
          ...(data.approved && {
            approvedAt: new Date(),
            approvedBy: ctx.session.user.id,
          }),
        },
      });
    }),

  // Get pending articles that need approval
  getPending: adminProcedure.query(async ({ ctx }) => {
    const pendingArticles = await ctx.db.article.findMany({
      where: {
        needsApproval: true,
        approved: false,
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return pendingArticles;
  }),

  // Get pending revisions that need approval
  getPendingRevisions: adminProcedure.query(async ({ ctx }) => {
    const pendingRevisions = await ctx.db.revision.findMany({
      where: {
        needsApproval: true,
        approved: false,
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
            name: true,
            image: true,
          },
        },
      },
    });

    return pendingRevisions;
  }),

  // Approve an article
  approve: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { id: input.id },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      return ctx.db.article.update({
        where: { id: input.id },
        data: {
          approved: true,
          needsApproval: false,
          approvedAt: new Date(),
          approvedBy: ctx.session.user.id,
        },
      });
    }),

  // Reject an article
  reject: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { id: input.id },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      return ctx.db.article.update({
        where: { id: input.id },
        data: {
          approved: false,
          needsApproval: false,
        },
      });
    }),

  // Approve a revision and update article content
  approveRevision: adminProcedure
    .input(z.object({ revisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get the revision with its article
      const revision = await ctx.db.revision.findUnique({
        where: { id: input.revisionId },
        include: {
          article: {
            select: {
              id: true,
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

      // Update the revision to approved
      await ctx.db.revision.update({
        where: { id: input.revisionId },
        data: {
          approved: true,
          needsApproval: false,
          approvedAt: new Date(),
          approvedBy: ctx.session.user.id,
        },
      });

      // Update the article with the revision content
      await ctx.db.article.update({
        where: { id: revision.articleId },
        data: {
          content: revision.content,
          // Also update the new fields if they exist in the revision
          ...(revision.quickFacts ? { quickFacts: revision.quickFacts } : {}),
          ...(revision.sources ? { sources: revision.sources } : {}),
          ...(revision.talkContent
            ? { talkContent: revision.talkContent }
            : {}),
          updatedAt: new Date(),
        },
      });

      return { success: true };
    }),

  // Reject a revision
  rejectRevision: adminProcedure
    .input(z.object({ revisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const revision = await ctx.db.revision.findUnique({
        where: { id: input.revisionId },
      });

      if (!revision) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Revision not found",
        });
      }

      // Update the revision to rejected
      await ctx.db.revision.update({
        where: { id: input.revisionId },
        data: {
          approved: false,
          needsApproval: false,
        },
      });

      return { success: true };
    }),

  // Add other admin-specific article operations here
  // For example: approve, reject, delete articles, etc.

  // Preview pending article (even if not approved)
  previewPendingArticle: adminProcedure
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

  // Preview pending revision (even if not approved)
  previewPendingRevision: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const revision = await ctx.db.revision.findUnique({
        where: { id: input.id },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              content: true, // Include current article content for comparison
              quickFacts: true,
              sources: true,
              talkContent: true,
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

  // Compare pending revision with current article content
  comparePendingRevision: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const revision = await ctx.db.revision.findUnique({
        where: { id: input.id },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              content: true,
              quickFacts: true,
              sources: true,
              talkContent: true,
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

      // Create a comparison object with the revision and current article
      return {
        currentRevision: revision,
        oldRevision: {
          id: "current",
          content: revision.article.content,
          quickFacts: revision.article.quickFacts,
          sources: revision.article.sources,
          talkContent: revision.article.talkContent,
          summary: null,
          createdAt: new Date(),
          articleId: revision.article.id,
          editorId: "",
          editor: {
            id: "",
            name: "Current Version",
            image: null,
          },
          article: {
            id: revision.article.id,
            slug: revision.article.slug,
            title: revision.article.title,
          },
        },
        article: revision.article,
      };
    }),
});
