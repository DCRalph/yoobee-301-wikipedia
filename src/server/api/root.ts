import { adminRouter } from "~/server/api/routers/admin";
import { userRouter } from "~/server/api/routers/user";
import { testingRouter } from "~/server/api/routers/testing";
import { stripeRouter } from "~/server/api/routers/stripe";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { summariesRouter } from "./routers/user/summaries";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  user: userRouter,
  testing: testingRouter,
  stripe: stripeRouter,
  summaries: summariesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
