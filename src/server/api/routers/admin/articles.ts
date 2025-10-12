import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

export const adminArticlesRouter = createTRPCRouter({
  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        filterPublished: z.boolean().optional(),
        filterApproved: z.boolean().optional(),
        filterNeedsApproval: z.boolean().optional(),
        sortField: z.string().optional().default("updatedAt"),
        sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        limit,
        search,
        filterPublished,
        filterApproved,
        filterNeedsApproval,
        sortField,
        sortDirection,
      } = input;

      // Calculate offset based on page and limit
      const skip = (page - 1) * limit;

      // Build where conditions based on filters and search term
      const whereConditions: Prisma.ArticleWhereInput = {};

      // Apply status filters
      if (filterPublished !== undefined) {
        whereConditions.published = filterPublished;
      }

      if (filterApproved !== undefined) {
        whereConditions.approved = filterApproved;
      }

      if (filterNeedsApproval !== undefined) {
        whereConditions.needsApproval = filterNeedsApproval;
      }

      // Apply search term if provided
      if (search && search.trim() !== "") {
        const searchTerm = search.trim();

        // Extract tags from search term
        const tagRegex = /\[([^\]]+)\]/g;
        const tags: string[] = [];
        let match;
        let searchString = searchTerm;

        while ((match = tagRegex.exec(searchTerm)) !== null) {
          const tag = match[1];
          if (tag) {
            tags.push(tag);
          }
        }

        // Remove tags from search string
        searchString = searchTerm.replace(/\[[^\]]+\]/g, "").trim();

        // Process tags
        tags.forEach((tag) => {
          // Handle specific tags
          if (tag.toLowerCase() === "published") {
            whereConditions.published = true;
          } else if (tag.toLowerCase() === "draft") {
            whereConditions.published = false;
          } else if (tag.toLowerCase() === "approved") {
            whereConditions.approved = true;
          } else if (tag.toLowerCase() === "pending") {
            whereConditions.needsApproval = true;
          } else if (tag.toLowerCase() === "rejected") {
            whereConditions.approved = false;
            whereConditions.needsApproval = false;
          }
        });

        // Apply text search if there's any remaining search string
        if (searchString) {
          whereConditions.OR = [
            { title: { contains: searchString, mode: "insensitive" } },
            { slug: { contains: searchString, mode: "insensitive" } },
            // { content: { contains: searchString, mode: "insensitive" } },
          ];
        }
      }

      // Count total articles matching the query
      const total = await ctx.db.article.count({
        where: whereConditions,
      });

      // Setup sort options - validate the field is an actual field in the model
      // Only allow sorting by specific fields to prevent SQL injection
      const allowedSortFields = [
        "title",
        "slug",
        "updatedAt",
        "createdAt",
        "published",
        "approved",
      ];

      const finalSortField = allowedSortFields.includes(sortField)
        ? sortField
        : "updatedAt";

      // Create dynamic order by object
      const orderBy: Prisma.ArticleOrderByWithRelationInput = {
        [finalSortField]: sortDirection,
      };

      // Get articles with pagination
      const articles = await ctx.db.article.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy,
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

      return {
        articles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
      // await ctx.db.note.deleteMany({
      //   where: { articleId: input.id },
      // });

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
