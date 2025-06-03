import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "../../trpc";
import { TRPCError } from "@trpc/server";
// import { generateSummary } from "~/lib/summary-generator";
import { generateTextDiff } from "~/lib/diff-utils";
import { moderateContent } from "~/lib/ai-moderator";
import { vectorSearch, findSimilarArticles } from "~/lib/vector-search";

export const userArticlesRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
        page: z.number().min(1).default(1),
        sortBy: z
          .enum(["viewCount", "dailyViews", "updatedAt"])
          .default("updatedAt"),
        searchTerm: z.string().optional(),
        vectorSearch: z.boolean().default(false),
        vectorSearchType: z
          .enum(["title", "content", "hybrid"])
          .default("title"),
        titleWeight: z.number().min(0).max(1).default(0.3),
        contentWeight: z.number().min(0).max(1).default(0.7),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        limit,
        cursor,
        sortBy,
        searchTerm,
        page,
        vectorSearch: useVectorSearch,
        vectorSearchType,
        titleWeight,
        contentWeight,
      } = input;

      console.log("\n".repeat(10));

      // If vector search is enabled and we have a search term, use vector search
      if (useVectorSearch && searchTerm && searchTerm.trim() !== "") {
        try {
          const vectorResponse = await vectorSearch({
            searchTerm: searchTerm.trim(),
            itemsPerPage: limit,
            searchType: vectorSearchType,
            page,
            maxQueryLimit: 40,
            titleWeight,
            contentWeight,
          });

          // Convert vector results to match the expected format
          const articles = await Promise.all(
            vectorResponse.results.map(async (result) => {
              // const author = await ctx.db.user.findUnique({
              //   where: { id: result.authorId },
              //   select: {
              //     id: true,
              //     name: true,
              //     image: true,
              //   },
              // });

              return {
                id: result.id,
                title: result.title,
                content: result.content,
                slug: result.slug,
                published: result.published,
                approved: result.approved,
                needsApproval: result.needsApproval,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
                author: result.author ?? null,
                // author: {
                //   id: result.author.id,
                //   name: "Unknown",
                // },
                // Add vector search metadata
                vectorDistance: result.distance,
                titleDistance: result.titleDistance,
                contentDistance: result.contentDistance,
                dailyViews: result.dailyViews,
                viewCount: result.viewCount,
              };
            }),
          );

          return {
            articles,
            nextCursor: undefined, // Vector search uses page-based pagination
            pagination: {
              total: vectorResponse.totalFound,
              page,
              limit,
              totalPages: vectorResponse.totalPages,
            },
            vectorSearch: true,
            searchType: vectorSearchType,
            // Add performance statistics
            vectorStats: {
              executionTime: vectorResponse.executionTime,
              totalResults: vectorResponse.totalFound,
              vectorizedArticles: vectorResponse.stats.articlesWithBothVectors,
              searchType: vectorResponse.searchType,
            },
          };
        } catch (error) {
          console.error("Vector search failed:", error);
          // Fall back to regular search if vector search fails
        }
      }

      // Regular database search (fallback or when vector search is disabled)
      // Build the where clause based on filters and search term
      const where = {
        published: true,
        approved: true,
        needsApproval: false,
        // ...(searchTerm !== undefined && searchTerm.trim() !== ""
        //   ? {
        //       OR: [
        //         {
        //           title: { contains: searchTerm, mode: "insensitive" as const },
        //         },
        //         {
        //           content: {
        //             contains: searchTerm,
        //             mode: "insensitive" as const,
        //           },
        //         },
        //       ],
        //     }
        //   : {}),
      };

      // Get total count for pagination
      const total = await ctx.db.article.count({ where });

      // Calculate skip based on page number if provided, otherwise use cursor
      const skip = cursor ? undefined : (page - 1) * limit;

      // Determine sort order
      const orderBy = {
        [sortBy]: "desc",
      };

      const articles = await ctx.db.article.findMany({
        take: limit + 1,
        skip,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy,
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
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        vectorSearch: false,
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
        quickFacts: z.record(z.string()).optional(),
        sources: z.string().optional(),
        talkContent: z.string().optional(),
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
          quickFacts: input.quickFacts!,
          sources: input.sources,
          talkContent: input.talkContent,
        },
      });
    }),

  // summarize: protectedProcedure
  //   .input(
  //     z.object({
  //       articleId: z.string(),
  //       level: z
  //         .enum(["novice", "intermediate", "advanced"])
  //         .default("intermediate"),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const article = await ctx.db.article.findUnique({
  //       where: { id: input.articleId, approved: true },
  //     });
  //     if (!article) {
  //       throw new TRPCError({
  //         code: "NOT_FOUND",
  //         message: "Article not found",
  //       });
  //     }
  //     const summary = await generateSummary({
  //       content: article.content,
  //       level: input.level,
  //     });
  //     return { summary };
  //   }),

  // saveSummary: protectedProcedure
  //   .input(
  //     z.object({
  //       articleId: z.string(),
  //       summary: z.string().min(10),
  //       level: z
  //         .enum(["novice", "intermediate", "advanced"])
  //         .default("intermediate"),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     // Save summary as a Note of type 'AI_SUMMARY' linked to the article and user

  //     const levelMap = {
  //       novice: "AI_SUMMARY_NOVICE",
  //       intermediate: "AI_SUMMARY_INTERMEDIATE",
  //       advanced: "AI_SUMMARY_ADVANCED",
  //     };

  //     await ctx.db.note.create({
  //       data: {
  //         content: input.summary,
  //         type: levelMap[input.level],
  //         articleId: input.articleId,
  //         userId: ctx.session.user.id,
  //       },
  //     });
  //     return { success: true };
  //   }),

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
          quickFacts: article.quickFacts,
          sources: article.sources,
          talkContent: article.talkContent,
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
        quickFacts: z.record(z.string()).optional(),
        sources: z.string().optional(),
        talkContent: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the article to verify it exists
      const article = await ctx.db.article.findUnique({
        where: { id: input.articleId },
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
        article.content !== input.content ||
        JSON.stringify(article.quickFacts) !==
          JSON.stringify(input.quickFacts) ||
        article.sources !== input.sources ||
        article.talkContent !== input.talkContent;

      // Don't create a revision if nothing has changed
      if (!contentChanged) {
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
        aiMessage =
          aiModeration.error ??
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
          quickFacts: input.quickFacts!,
          sources: input.sources,
          talkContent: input.talkContent,
          approved: approvedByAi,
          needsApproval: !approvedByAi,
          checkedByAi,
          aiMessage,
        },
      });

      if (approvedByAi) {
        await ctx.db.article.update({
          where: { id: input.articleId },
          data: {
            content: input.content,
            quickFacts: input.quickFacts!,
            sources: input.sources,
            talkContent: input.talkContent,
          },
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
        filter: z
          .enum(["all", "pending", "approved", "rejected"])
          .optional()
          .default("all"),
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
        ...(filter === "pending"
          ? { needsApproval: true }
          : filter === "approved"
            ? { approved: true, needsApproval: false }
            : filter === "rejected"
              ? { approved: false, needsApproval: false }
              : {}),
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

  getArticleRevisions: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { slug, limit, cursor } = input;

      // First get the article to make sure it exists and is approved
      const article = await ctx.db.article.findUnique({
        where: {
          slug,
          approved: true,
          needsApproval: false,
        },
        select: { id: true },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      const revisions = await ctx.db.revision.findMany({
        where: {
          articleId: article.id,
          approved: true,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
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
        searchTerm: z.string(),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { searchTerm, limit } = input;

      const articles = await ctx.db.article.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { content: { contains: searchTerm, mode: "insensitive" } },
          ],
          approved: true,
          needsApproval: false,
        },
        take: limit,
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

      return {
        articles,
      };
    }),

  findSimilarArticles: publicProcedure
    .input(
      z.object({
        articleId: z.string(),
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { articleId, limit } = input;

      // First verify the article exists and is accessible
      const sourceArticle = await ctx.db.article.findUnique({
        where: {
          id: articleId,
          published: true,
          approved: true,
          needsApproval: false,
        },
        select: { id: true, title: true, authorId: true },
      });

      if (!sourceArticle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      try {
        // Use vector search to find similar articles
        const vectorResponse = await findSimilarArticles(articleId, limit);

        // Convert vector results to match the expected format
        const articles = await Promise.all(
          vectorResponse.results.map(async (result) => {
            const author = await ctx.db.user.findUnique({
              where: { id: result.author.id },
              select: {
                id: true,
                name: true,
                image: true,
              },
            });

            return {
              id: result.id,
              title: result.title,
              content: result.content,
              slug: result.slug,
              published: result.published,
              approved: result.approved,
              needsApproval: result.needsApproval,
              createdAt: result.createdAt,
              updatedAt: result.updatedAt,
              author: author ?? null,
              // author: {
              //   id: result.author.id,
              //   name: "Unknown",
              //   image: null,
              // },
              // Add vector search metadata
              vectorDistance: result.distance,
              titleDistance: result.titleDistance,
              contentDistance: result.contentDistance,
            };
          }),
        );

        return {
          sourceArticle,
          similarArticles: articles,
          vectorSearch: true,
          vectorStats: {
            executionTime: vectorResponse.executionTime,
            totalResults: vectorResponse.totalFound,
            searchType: vectorResponse.searchType,
          },
        };
      } catch (error) {
        console.error("Vector similarity search failed:", error);

        // Fallback to basic similarity using database queries
        // This is a simple fallback that finds articles by the same author or with similar titles
        const fallbackArticles = await ctx.db.article.findMany({
          where: {
            AND: [
              { id: { not: articleId } },
              { published: true },
              { approved: true },
              { needsApproval: false },
            ],
            OR: [
              { authorId: sourceArticle.authorId }, // Same author
              {
                title: {
                  contains: sourceArticle.title.split(" ")[0], // First word of title
                  mode: "insensitive",
                },
              },
            ],
          },
          take: limit,
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

        return {
          sourceArticle,
          similarArticles: fallbackArticles,
          vectorSearch: false,
        };
      }
    }),
});
