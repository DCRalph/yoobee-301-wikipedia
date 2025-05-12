import { createTRPCRouter } from "../../trpc";
import { userArticlesRouter } from "./articles";
import { userProfileRouter } from "./profile";
import { userNotesRouter } from "./notes";

export const userRouter = createTRPCRouter({
  articles: userArticlesRouter,
  profile: userProfileRouter,
  notes: userNotesRouter,
});
