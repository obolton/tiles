import { router } from "@/utils/trpc";
import auth from "./auth/router";
import pages from "./pages/router";
import media from "./media/router";
import users from "./users/router";
import places from "./places/router";
import themes from "./themes/router";
import externalLinks from "./links/router";
import bookmarks from "./bookmarks/router";
import ai from "./ai/router";
import collaboration from "./collaboration/router";
import folders from "./folders/router";
import workspaces from "./workspaces/router";
import versions from "./versions/router";
import videos from "./videos/router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

const appRouter = router({
  auth,
  pages,
  media,
  users,
  places,
  themes,
  externalLinks,
  bookmarks,
  ai,
  collaboration,
  folders,
  workspaces,
  versions,
  videos,
});

export type AppRouter = typeof appRouter;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;

export default appRouter;
