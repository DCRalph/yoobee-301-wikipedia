import { createTRPCRouter, adminProcedure } from "../../trpc";

export const adminDashboardRouter = createTRPCRouter({
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    // Get user stats
    const users = await ctx.db.user.findMany({
      // take: 5,
      select: {
        id: true,
        name: true,
        image: true,
        articles: {
          select: {
            id: true,
          },
        },
      },
    });

    const totalUsers = await ctx.db.user.count();

    // Get published articles stats
    const publishedArticles = await ctx.db.article.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
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

    const totalPublishedArticles = await ctx.db.article.count({
      where: { published: true },
    });

    // Get draft articles stats
    const draftArticles = await ctx.db.article.findMany({
      where: { published: false },
      orderBy: { updatedAt: "desc" },
      // take: 5,
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

    const totalDraftArticles = await ctx.db.article.count({
      where: { published: false },
    });

    // Combine the most recent articles from both published and drafts
    const recentArticles = [...publishedArticles, ...draftArticles]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    return {
      stats: {
        totalUsers,
        totalArticles: totalPublishedArticles + totalDraftArticles,
        totalPublishedArticles,
        totalDraftArticles,
      },
      recentUsers: users,
      recentArticles,
    };
  }),
});
