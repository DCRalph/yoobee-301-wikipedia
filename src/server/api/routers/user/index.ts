import { createTRPCRouter } from "../../trpc";
import { userArticlesRouter } from "./articles";
import { userProfileRouter } from "./profile";
import { summariesRouter } from "./summaries";

export const userRouter = createTRPCRouter({
  articles: userArticlesRouter,
  profile: userProfileRouter,
  summaries: summariesRouter,
});
