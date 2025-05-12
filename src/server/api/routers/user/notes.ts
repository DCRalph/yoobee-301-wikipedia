import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const userNotesRouter = createTRPCRouter({
  // Get all notes for the current user
  getNotes: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const notes = await ctx.db.note.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: {
          userId: ctx.session.user.id,
        },
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

      let nextCursor: typeof cursor = undefined;
      if (notes.length > limit) {
        const nextItem = notes.pop();
        nextCursor = nextItem?.id;
      }

      return {
        notes,
        nextCursor,
      };
    }),

  // Delete a note
  deleteNote: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.note.findUnique({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!note) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
      }

      // Ensure the user owns this note
      if (note.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this note",
        });
      }

      // Delete the note
      await ctx.db.note.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
