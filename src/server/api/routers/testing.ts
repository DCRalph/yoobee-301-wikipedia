import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { generateSummary } from "~/lib/summary-generator";
import { moderateContent } from "~/lib/ai-moderator";
import { generateTextDiff } from "~/lib/diff-utils";

// Input schema for moderation
const moderationInputSchema = z.object({
  oldContent: z.string().default(""),
  newContent: z.string(),
});

// Input schema for summarizer test
const summarizerInputSchema = z.object({
  content: z.string(),
  level: z
    .enum(["novice", "intermediate", "advanced"])
    .default("intermediate"),
});

export const testingRouter = createTRPCRouter({
  testModeration: publicProcedure
    .input(moderationInputSchema)
    .mutation(async ({ input }) => {
      const { oldContent, newContent } = input;

      // Generate diff between old and new content
      const diff = generateTextDiff(oldContent, newContent);

      // Use the AI moderator to check content
      const result = await moderateContent(newContent, diff);

      return result;
    }),
  testSummarize: publicProcedure
    .input(summarizerInputSchema)
    .mutation(async ({ input }) => {
      const { content, level } = input;

      // Use the summary generator to create a summary
      const summary = await generateSummary({
        content,
        level,
      });

      return { summary };
    }),
}); 