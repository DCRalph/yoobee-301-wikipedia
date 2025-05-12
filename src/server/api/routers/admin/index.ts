import { createTRPCRouter } from "../../trpc";
import { adminUsersRouter } from "./users";
import { adminArticlesRouter } from "./articles";
import { adminDashboardRouter } from "./dashboard";
import { adminSettingsRouter } from "./settings";
import { adminRevisionsRouter } from "./revisions";

export const adminRouter = createTRPCRouter({
  users: adminUsersRouter,
  articles: adminArticlesRouter,
  dashboard: adminDashboardRouter,
  settings: adminSettingsRouter,
  revisions: adminRevisionsRouter,
});
