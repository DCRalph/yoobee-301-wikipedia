import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { GameStatus } from "@prisma/client";

export const gameRouter = createTRPCRouter({
  // Start a new Six Degrees game
  startGame: protectedProcedure
    .input(
      z.object({
        startArticleId: z.string(),
        endArticleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user already has an active game
      const activeGame = await ctx.db.gameSession.findFirst({
        where: {
          userId,
          status: GameStatus.IN_PROGRESS,
        },
      });

      if (activeGame) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an active game session",
        });
      }

      // Verify both articles exist and are published
      const [startArticle, endArticle] = await Promise.all([
        ctx.db.article.findUnique({
          where: { id: input.startArticleId },
          select: { id: true, title: true, slug: true, published: true },
        }),
        ctx.db.article.findUnique({
          where: { id: input.endArticleId },
          select: { id: true, title: true, slug: true, published: true },
        }),
      ]);

      if (!startArticle?.published || !endArticle?.published) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or both articles not found or not published",
        });
      }

      // Create the initial path with the starting article
      const initialPath = [
        {
          articleId: input.startArticleId,
          timestamp: new Date().toISOString(),
        },
      ];

      // Create new game session with currentArticle set to start article
      const gameSession = await ctx.db.gameSession.create({
        data: {
          userId,
          startArticleId: input.startArticleId,
          endArticleId: input.endArticleId,
          currentArticleId: input.startArticleId, // Set current article to start article
          status: GameStatus.IN_PROGRESS,
          path: initialPath,
        },
        include: {
          startArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          endArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          currentArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      return gameSession;
    }),

  // Make a move in the game
  makeMove: protectedProcedure
    .input(
      z.object({
        gameSessionId: z.string(),
        nextArticleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Fetch the active game session
      const gameSession = await ctx.db.gameSession.findFirst({
        where: {
          id: input.gameSessionId,
          userId,
          status: GameStatus.IN_PROGRESS,
        },
        include: {
          startArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          endArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      if (!gameSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game session not found or not active",
        });
      }

      // Validate the next article exists and is published/approved
      const nextArticle = await ctx.db.article.findFirst({
        where: {
          id: input.nextArticleId,
          published: true,
          approved: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });

      if (!nextArticle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target article not found or not available",
        });
      }

      // Get the current path and find the last article
      const currentPath = gameSession.path as Array<{
        articleId: string;
        timestamp: string;
      }>;
      const lastArticleId = currentPath[currentPath.length - 1]?.articleId;

      if (!lastArticleId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid game state - no articles in path",
        });
      }

      // Verify there's a link from the current article to the next article
      const currentArticle = await ctx.db.article.findUnique({
        where: { id: lastArticleId },
      });

      if (!currentArticle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current article not found",
        });
      }

      const validLink =
        currentArticle.content.includes("/wiki/" + nextArticle.slug) ||
        JSON.stringify(currentArticle.quickFacts).includes(
          "/wiki/" + nextArticle.slug,
        );

      if (!validLink) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No valid link found from current article to target article " +
            currentArticle.slug +
            " to " +
            nextArticle.slug,
        });
      }

      // Update the game session
      const newPath = [
        ...currentPath,
        { articleId: input.nextArticleId, timestamp: new Date().toISOString() },
      ];

      const isGameComplete = input.nextArticleId === gameSession.endArticleId;

      const updatedGameSession = await ctx.db.gameSession.update({
        where: { id: input.gameSessionId },
        data: {
          path: newPath,
          clicks: { increment: 1 },
          currentArticleId: input.nextArticleId, // Update current article position
          ...(isGameComplete && {
            status: GameStatus.COMPLETED,
            endTime: new Date(),
          }),
        },
        include: {
          startArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          endArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          currentArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      return updatedGameSession;
    }),

  // Forfeit the current game
  forfeitGame: protectedProcedure
    .input(
      z.object({
        gameSessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const gameSession = await ctx.db.gameSession.findFirst({
        where: {
          id: input.gameSessionId,
          userId,
          status: GameStatus.IN_PROGRESS,
        },
      });

      if (!gameSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game session not found or not active",
        });
      }

      const updatedGameSession = await ctx.db.gameSession.update({
        where: { id: input.gameSessionId },
        data: {
          status: GameStatus.FORFEITED,
          endTime: new Date(),
        },
        include: {
          startArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          endArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      return updatedGameSession;
    }),

  // Get the user's active game
  getActiveGame: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const activeGame = await ctx.db.gameSession.findFirst({
      where: {
        userId,
        status: GameStatus.IN_PROGRESS,
      },
      include: {
        startArticle: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        endArticle: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        currentArticle: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return activeGame;
  }),

  // Get game result with detailed path information
  getGameResult: protectedProcedure
    .input(
      z.object({
        gameSessionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const gameSession = await ctx.db.gameSession.findFirst({
        where: {
          id: input.gameSessionId,
          userId,
        },
        include: {
          startArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          endArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      if (!gameSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game session not found",
        });
      }

      // Get article details for the path
      const path = gameSession.path as Array<{
        articleId: string;
        timestamp: string;
      }>;
      const articleIds = path.map((p) => p.articleId);

      const articles = await ctx.db.article.findMany({
        where: {
          id: { in: articleIds },
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });

      // Map articles to path with timestamps
      const detailedPath = path.map((pathItem) => {
        const article = articles.find((a) => a.id === pathItem.articleId);
        return {
          article,
          timestamp: pathItem.timestamp,
        };
      });

      return {
        ...gameSession,
        detailedPath,
      };
    }),

  // Get leaderboard
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const leaderboard = await ctx.db.gameSession.findMany({
        where: {
          status: GameStatus.COMPLETED,
        },
        orderBy: [
          { clicks: "asc" },
          { startTime: "asc" }, // For games with same clicks, prioritize earlier completion
        ],
        take: input.limit,
        skip: input.offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          startArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          endArticle: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      // Calculate duration for each game
      const leaderboardWithDuration = leaderboard.map((game) => ({
        ...game,
        duration:
          game.endTime && game.startTime
            ? Math.round(
                (game.endTime.getTime() - game.startTime.getTime()) / 1000,
              ) // Duration in seconds
            : null,
      }));

      return leaderboardWithDuration;
    }),

  // Helper to get article ID by slug for game moves
  getArticleIdBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: {
          slug: input.slug,
          published: true,
          approved: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
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
});
