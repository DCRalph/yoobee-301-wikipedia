import { createTRPCRouter, adminProcedure } from "../../trpc";

export const adminDashboardRouter = createTRPCRouter({
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    // Get user stats
    console.time("users query");
    const users = await ctx.db.user.findMany({
      // take: 5,
      select: {
        id: true,
        name: true,
        image: true,
        // articles: {
        //   select: {
        //     id: true,
        //   },
        // },
      },
    });
    console.timeEnd("users query");

    const totalUsers = await ctx.db.user.count();

    // Get published articles stats with timing
    console.time("publishedArticles query");
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
    console.timeEnd("publishedArticles query");

    console.time("totalPublishedArticles count");
    const totalPublishedArticles = await ctx.db.article.count({
      where: { published: true },
    });
    console.timeEnd("totalPublishedArticles count");

    // Get draft articles stats with timing
    console.time("draftArticles query");
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
    console.timeEnd("draftArticles query");

    console.time("totalDraftArticles count");
    const totalDraftArticles = await ctx.db.article.count({
      where: { published: false },
    });
    console.timeEnd("totalDraftArticles count");

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
