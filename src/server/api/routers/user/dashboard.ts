import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const userDashboardRouter = createTRPCRouter({
  // Get suggested edits/topics for the user
  getSuggestedTopics: protectedProcedure.query(async ({}) => {
    return {
      topics: [
        "Culture",
        "Arts",
        "Technology",
        "Science",
        "History",
        "Geography",
      ],
    };
  }),

  // Get user's recent activity
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const recentArticles = await ctx.db.article.findMany({
      where: { authorId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
        published: true,
      },
    });

    return {
      articles: recentArticles,
      hasActivity: recentArticles.length > 0,
    };
  }),

  // Get user's watch list (placeholder for now)
  getWatchList: protectedProcedure.query(async ({ ctx }) => {
    // For now, return user's own articles as "watched"
    const watchedArticles = await ctx.db.article.findMany({
      where: {
        authorId: ctx.session.user.id,
        published: true,
      },
      take: 10,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
        viewCount: true,
      },
    });

    return {
      articles: watchedArticles,
    };
  }),

  // Get user statistics
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get edit count from revisions
    const articlesCount = await ctx.db.revision.count({
      where: { editorId: userId },
    });

    // Get user info
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
    });

    // Get articles created by user
    const articlesCreated = await ctx.db.article.findMany({
      where: {
        authorId: userId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        published: true,
        approved: true,
        viewCount: true,
      },
    });

    return {
      user,
      stats: {
        totalEdits: articlesCount,
        longestStreak: 0,
        memberSince: user?.createdAt ?? new Date(),
        totalArticlesCreated: articlesCreated.length,
      },
      articlesCreated: {
        articles: articlesCreated,
        hasArticles: articlesCreated.length > 0,
      },
      mentor: null,
    };
  }),

  // Get user contributions summary
  getContributions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get recent edits (both articles and revisions)
    const recentArticles = await ctx.db.article.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
        published: true,
        approved: true,
      },
    });

    const recentRevisions = await ctx.db.revision.findMany({
      where: { editorId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // Get articles created by user
    const articlesCreated = await ctx.db.article.findMany({
      where: {
        authorId: userId,
        published: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        viewCount: true,
      },
    });

    return {
      recentEdits: {
        articles: recentArticles,
        revisions: recentRevisions,
        hasEdits: recentArticles.length > 0 || recentRevisions.length > 0,
      },
      articlesCreated: {
        articles: articlesCreated,
        hasArticles: articlesCreated.length > 0,
      },
    };
  }),
});
