import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { Role } from "@prisma/client";

export const adminUsersRouter = createTRPCRouter({
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        role: z.nativeEnum(Role),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user with this email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Create the user
      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
        },
      });
    }),

  getAll: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const users = await ctx.db.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          articles: {
            select: {
              id: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      return {
        users,
        nextCursor,
      };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          articles: {
            select: {
              id: true,
              title: true,
              slug: true,
              published: true,
            },
          },
        },
      });
    }),

  updateRole: adminProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.nativeEnum(Role),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.id },
        data: { role: input.role },
      });
    }),
});
