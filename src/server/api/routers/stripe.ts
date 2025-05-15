import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createCheckoutSession } from "~/lib/stripe";

export const stripeRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        amount: z.number().int().positive().min(300),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get the origin
        const origin =
          ctx.headers.get("origin") ??
          (typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000");

        // Create checkout session
        const session = await createCheckoutSession(
          input.amount,
          `${origin}/donate/success`,
          `${origin}/donate`,
        );

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error) {
        console.error("Error creating Stripe checkout session:", error);
        throw error;
      }
    }),
});
