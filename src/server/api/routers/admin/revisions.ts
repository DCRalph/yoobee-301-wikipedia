import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

export const adminRevisionsRouter = createTRPCRouter({
  getAllRevisions: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
      filter: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor, filter } = input;

      // Build where conditions based on filters
      const where: Prisma.RevisionWhereInput = {};

      if (filter === "pending") {
        where.needsApproval = true;
      } else if (filter === "approved") {
        where.approved = true;
        where.needsApproval = false;
      } else if (filter === "rejected") {
        where.approved = false;
        where.needsApproval = false;
      }

      const revisions = await ctx.db.revision.findMany({
        take: limit + 1, // Take one more to determine if there are more results
        where,
        cursor: cursor ? { id: cursor } : undefined,
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

      let nextCursor: string | undefined = undefined;
      if (revisions.length > limit) {
        const nextItem = revisions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        revisions,
        nextCursor,
      };
    }),

  getRevisionById: adminProcedure
    .input(z.object({ revisionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const revision = await ctx.db.revision.findUnique({
        where: { id: input.revisionId },
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

  approveRevision: adminProcedure
    .input(z.object({ revisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const revision = await ctx.db.revision.findUnique({
        where: { id: input.revisionId },
        select: { id: true, articleId: true, content: true, needsApproval: true },
      });

      if (!revision) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Revision not found",
        });
      }

      if (!revision.needsApproval) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This revision has already been processed",
        });
      }

      // First, update the revision status
      await ctx.db.revision.update({
        where: { id: input.revisionId },
        data: {
          approved: true,
          needsApproval: false,
        },
      });

      // Then, update the article with the approved content
      await ctx.db.article.update({
        where: { id: revision.articleId },
        data: {
          content: revision.content,
          updatedAt: new Date(),
        },
      });

      return { success: true };
    }),

  rejectRevision: adminProcedure
    .input(z.object({ revisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const revision = await ctx.db.revision.findUnique({
        where: { id: input.revisionId },
        select: { id: true, needsApproval: true },
      });

      if (!revision) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Revision not found",
        });
      }

      if (!revision.needsApproval) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This revision has already been processed",
        });
      }

      // Mark revision as rejected
      await ctx.db.revision.update({
        where: { id: input.revisionId },
        data: {
          approved: false,
          needsApproval: false,
        },
      });

      return { success: true };
    }),
}); 