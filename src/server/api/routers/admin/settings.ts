import { z } from "zod";
import { createTRPCRouter, adminProcedure, publicProcedure } from "../../trpc";

// Settings schema
const settingsSchema = z.object({
  allowRegistration: z.boolean(),
  allowArticleCreation: z.boolean(),
  enableAIFeatures: z.boolean().optional().default(false),
});

export const adminSettingsRouter = createTRPCRouter({
  // Get current site settings
  get: adminProcedure.query(async ({ ctx }) => {
    // Get the first settings object, or create one if it doesn't exist
    const settings = await ctx.db.setting.findFirst();

    if (!settings) {
      // Create default settings if none exist
      return ctx.db.setting.create({
        data: {
          allowRegistration: true,
          allowArticleCreation: true,
          enableAIFeatures: false,
        },
      });
    }

    return settings;
  }),

  // Public endpoint to get settings without authentication
  getPublic: publicProcedure.query(async ({ ctx }) => {
    // Get the first settings object, or create one if it doesn't exist
    const settings = await ctx.db.setting.findFirst();

    if (!settings) {
      return {
        allowRegistration: true,
        allowArticleCreation: true,
        enableAIFeatures: false,
      };
    }

    return {
      allowRegistration: settings.allowRegistration,
      allowArticleCreation: settings.allowArticleCreation,
      enableAIFeatures: settings.enableAIFeatures,
    };
  }),

  // Update site settings
  update: adminProcedure
    .input(settingsSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the first settings object
      const settings = await ctx.db.setting.findFirst();

      if (!settings) {
        // Create settings if they don't exist
        return ctx.db.setting.create({
          data: {
            allowRegistration: input.allowRegistration,
            allowArticleCreation: input.allowArticleCreation,
            enableAIFeatures: input.enableAIFeatures ?? false,
          },
        });
      }

      // Update existing settings
      return ctx.db.setting.update({
        where: { id: settings.id },
        data: {
          allowRegistration: input.allowRegistration,
          allowArticleCreation: input.allowArticleCreation,
          enableAIFeatures: input.enableAIFeatures ?? false,
        },
      });
    }),
});
