import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const userProfileRouter = createTRPCRouter({
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        accounts: {
          select: {
            id: true,
            provider: true,
            type: true,
            password: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Transform accounts data to not expose sensitive information
    const accounts = user.accounts.map((account) => ({
      id: account.id,
      provider: account.provider,
      type: account.type,
      hasPassword: !!account.password,
    }));

    return {
      ...user,
      accounts,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(50).optional(),
        image: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.image ? { image: input.image } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    }),

  addPassword: protectedProcedure
    .input(
      z.object({
        password: z.string().min(8).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a credentials account
      const existingCredentialsAccount = await ctx.db.account.findFirst({
        where: {
          userId: ctx.session.user.id,
          provider: "credentials",
        },
      });

      if (existingCredentialsAccount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a password set",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create a new credentials account
      await ctx.db.account.create({
        data: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: ctx.session.user.email ?? ctx.session.user.id,
          password: hashedPassword,
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find the user's credentials account
      const credentialsAccount = await ctx.db.account.findFirst({
        where: {
          userId: ctx.session.user.id,
          provider: "credentials",
        },
      });

      if (!credentialsAccount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You don't have a password set",
        });
      }

      if (!credentialsAccount.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid account configuration",
        });
      }

      // Verify the current password
      const isPasswordValid = await bcrypt.compare(
        input.currentPassword,
        credentialsAccount.password,
      );

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect",
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Update the password
      await ctx.db.account.update({
        where: { id: credentialsAccount.id },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  getMyArticles: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const articles = await ctx.db.article.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        where: {
          authorId: ctx.session.user.id,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
          approved: true,
          needsApproval: true,
          createdAt: true,
          updatedAt: true,
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
      };
    }),
});
