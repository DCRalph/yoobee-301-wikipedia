import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { generateSummary } from "~/lib/summary-generator";

export const summariesRouter = createTRPCRouter({
  getByArticleId: publicProcedure
    .input(
      z.object({
        articleId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const summaries = await ctx.db.articleSummary.findMany({
        where: { articleId: input.articleId },
        select: {
          id: true,
          content: true,
          level: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // If no original summary exists, create one with the article's content
      const hasOriginal = summaries.some(s => s.level === "original");
      if (!hasOriginal) {
        const article = await ctx.db.article.findUnique({
          where: { id: input.articleId },
          select: { content: true },
        });

        if (article) {
          const originalSummary = await ctx.db.articleSummary.create({
            data: {
              articleId: input.articleId,
              level: "original",
              content: article.content,
            },
            select: {
              id: true,
              content: true,
              level: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          summaries.push(originalSummary);
        }
      }

      return summaries;
    }),

  generate: publicProcedure
    .input(
      z.object({
        articleId: z.string(),
        level: z.enum(["novice", "intermediate", "advanced"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.findUnique({
        where: { id: input.articleId },
        select: { content: true },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Check if summary already exists
      const existingSummary = await ctx.db.articleSummary.findUnique({
        where: {
          articleId_level: {
            articleId: input.articleId,
            level: input.level,
          },
        },
        select: {
          content: true,
        },
      });

      if (existingSummary) {
        return { content: existingSummary.content };
      }

      // Generate new summary
      const summary = await generateSummary({
        content: article.content,
        level: input.level,
      });

      // Save the summary
      const savedSummary = await ctx.db.articleSummary.create({
        data: {
          articleId: input.articleId,
          level: input.level,
          content: summary,
        },
        select: {
          content: true,
        },
      });

      return { content: savedSummary.content };
    }),
});
